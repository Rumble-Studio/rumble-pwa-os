import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Order, selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BrokerService } from '@rumble-pwa/broker-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { SideNavLink } from '@rumble-pwa/links/models';
import { LinksService } from '@rumble-pwa/links/services';
import { Notification, NotificationsQuery, NotificationsService as AkitaNotificationsService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Attr } from '@rumble-pwa/utils';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class NotificationsManagementService {
	notifications$$: BehaviorSubject<Notification[]>;
	notifications$: Observable<Notification[]>;

	refreshNotifications$ = new Subject<boolean>();

	constructor(
		private restService: RestService,
		private akitaNotificationsService: AkitaNotificationsService,
		private notificationsService: NotificationsService,
		private notificationsQuery: NotificationsQuery,
		private _usersRepository: UsersRepository,
		private brokerService: BrokerService,
		private usersRepository: UsersRepository,
		private router: Router,
		private _linksService: LinksService
	) {
		this.notifications$$ = this.notificationsQuery.notifications$$;
		this.notifications$ = this.notificationsQuery.notifications$;
		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});

		this.brokerService.broker$
			.pipe(
				untilDestroyed(this),
				tap((msg) => {
					if (msg === 'refresh-notifications') {
						this.refreshNotifications$.next(true);
					}
				})
			)
			.subscribe();

		// refresh notifications every 5 minutes
		setInterval(() => {
			this.refreshNotifications$.next(true);
		}, 10 * 60 * 1000);

		this.refreshNotifications$
			.pipe(
				untilDestroyed(this),
				debounceTime(1500),
				tap(() => {
					this.pullDataOnce();
				})
			)
			.subscribe();
	}

	pullData() {
		// get notifications data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Notification[]>('/notifications').subscribe((notificationApis) => {
					this.akitaNotificationsService.set(
						notificationApis.map((notificationApi) => {
							return { ...notificationApi, operation: 'refresh' };
						})
					);
				});
		});
	}

	pullDataOnce() {
		// get notifications data from server
		this._usersRepository.isConnected$$.pipe(take(1)).subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Notification[]>('/notifications').subscribe((notificationApis) => {
					this.akitaNotificationsService.set(
						notificationApis.map((notificationApi) => {
							return { ...notificationApi, operation: 'refresh' };
						})
					);
				});
		});
	}
	pushData() {
		this.notificationsQuery.notificationsToSync$.pipe(debounceTime(500)).subscribe((notifications) => {
			notifications.forEach((notification) => {
				if (notification?.operation === 'creation') {
					console.error('notification.operation === "creation"');
					// this._postToServer(notification);
				} else if (notification?.operation === 'update') this._putToServer(notification);
			});
		});
	}

	public add(data: Notification) {
		this.akitaNotificationsService.add(data);
	}
	public update(id: string, data: Partial<Notification>) {
		this.akitaNotificationsService.update(id, data);
	}
	public removeFromStore(id: string) {
		this.akitaNotificationsService.remove(id);
	}
	public delete(id: string) {
		this.akitaNotificationsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.akitaNotificationsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.akitaNotificationsService.update(id, { state: 'default' });
	}

	public getAll$() {
		const ownerId = this.usersRepository.connectedUser$$.getValue()?.id;

		return this.notificationsQuery.selectAll({
			sortBy: 'timeCreation',
			sortByOrder: Order.DESC,
			filterBy: (entity: Notification) =>
				ownerId
					? entity.concernedGroupIds.includes(ownerId) &&
					  ['deleted', 'archived'].indexOf(entity.state || 'default') == -1
					: false,
		});
	}

	public getAll() {
		const ownerId = this.usersRepository.connectedUser$$.getValue()?.id;
		return this.notificationsQuery.getAll({
			sortBy: 'timeCreation',
			sortByOrder: Order.DESC,
			filterBy: (entity: Notification) =>
				ownerId
					? entity.concernedGroupIds.includes(ownerId) &&
					  ['deleted', 'archived'].indexOf(entity.state || 'default') == -1
					: false,
		});
	}

	public get(id: string) {
		return this.notificationsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.notificationsQuery.selectEntity(id);
	}

	public toggleHasSeen(notificationId: string, hasSeen: boolean) {
		return this.restService
			.put<Notification>('/notifications/' + notificationId + '/toggle/' + hasSeen, {})
			.pipe(
				tap((r) => {
					this.akitaNotificationsService.upsert({
						...r,
						operation: 'refresh',
					});
				})
			)
			.subscribe();
	}

	//
	// SERVER SYNC
	//
	private _putToServer(notification: Notification) {
		return this.restService
			.put<Notification>('/notifications/' + notification.id, notification)
			.pipe(
				tap((r) => {
					this.akitaNotificationsService.upsert({
						...r,
						operation: 'refresh',
					});
				})
			)
			.subscribe();
	}
	private _postToServer(notification: Notification) {
		return this.restService
			.post<Notification>('/notifications', notification)
			.pipe(
				tap((r) => {
					// console.log('post result is:', r);
					this.akitaNotificationsService.upsert({
						...r,
						operation: 'refresh',
					});
				})
			)
			.subscribe();
	}

	processNotificationClick(notification: Notification) {
		const targetKind = notification.targetKind;
		const targetId = notification.targetId;

		console.log('processNotificationClick', notification.id, notification.targetKind, notification.targetId);

		if (!targetKind) return;

		const notificationKind = notification.kind;
		const notificationDetailsRaw = (notification.details?.length || 0) > 0 ? notification.details : '{}';
		const notificationDetails: Attr = JSON.parse(notificationDetailsRaw || '{}');
		console.log('navigation notification:', notificationKind, notificationDetails, notification);

		switch (targetKind) {
			case 'forms':
				if (!targetId) this.router.navigate(['/forms']);
				this.router.navigate(['/forms/editor', targetId]);
				break;
			case 'group':
				this.router.navigate(['/groups', targetId]);
				break;
			case 'groups':
				this.router.navigate(['/groups']);
				break;
			case 'mix':
				this.router.navigate(['/mixes', targetId], {
					queryParams:
						notificationKind === 'export-ready' && 'exportId' in notificationDetails
							? {
									exportId: notificationDetails['exportId'],
							  }
							: {},
				});
				break;
			case 'export':
				this.router.navigate(
					['/exports', targetId]
					// {
					// 	queryParams:
					// 		notificationKind === 'export-ready' && 'exportId' in notificationDetails
					// 			? {
					// 					exportId: notificationDetails['exportId'],
					// 			  }
					// 			: {},
					// }
				);
				break;
			// case 'password':
			// 	if (notification.kind === 'reset') {
			// 		this.authService.resetPasswordRequest(targetId as string);
			// 	}
			// 	break;
			case 'request-email-validation':
				this.notificationsService.confirm('Do you want to receive a validation email?').subscribe((confirmation) => {
					if (confirmation) {
						this.usersRepository.sendEmailValidation(undefined);
					}
				});
				break;
			case 'recordingSession':
				if (
					notificationDetails &&
					notificationDetails['redirectUrl'] &&
					typeof notificationDetails['redirectUrl'] === 'string'
				) {
					this.router.navigateByUrl(notificationDetails['redirectUrl']);
				}
				break;
			case 'navigation':
				if (
					notificationDetails &&
					notificationDetails['redirectUrl'] &&
					typeof notificationDetails['redirectUrl'] === 'string'
				) {
					this.router.navigateByUrl(notificationDetails['redirectUrl']);
				}
				break;
			default:
				this.router.navigate(['/notifications', notification.id]);
				break;
		}
	}

	getNotificationIcon(notification: Notification) {
		const targetKind = notification.targetKind;
		if (!targetKind) return 'notifications';

		const target: SideNavLink | undefined = this._linksService.getSideNavLinkIcon(targetKind);

		if (!target) return 'notifications';
		return target.matIcon;
	}
}
