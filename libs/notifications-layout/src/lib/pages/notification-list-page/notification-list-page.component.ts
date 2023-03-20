import { ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Notification } from '@rumble-pwa/mega-store';
import { NotificationsManagementService } from '@rumble-pwa/notifications-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { LayoutService } from '@rumble-pwa/utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-notification-list-page',
	templateUrl: './notification-list-page.component.html',
	styleUrls: ['./notification-list-page.component.scss'],
})
export class NotificationListPageComponent {
	layoutSize = 2;

	notifications: Notification[] = [];

	private displayReadNotifications$$ = new BehaviorSubject(true);
	public get displayReadNotifications() {
		return this.displayReadNotifications$$.value;
	}
	public set displayReadNotifications(value) {
		this.displayReadNotifications$$.next(value);
	}

	constructor(
		public dialog: MatDialog, //
		private layoutService: LayoutService,
		private notificationsManagementService: NotificationsManagementService,
		private cdr: ChangeDetectorRef,
		private usersRepository: UsersRepository
	) {
		this.layoutService.layoutSize$$.subscribe((value) => {
			this.layoutSize = value;
		});

		combineLatest([
			this.displayReadNotifications$$,
			this.notificationsManagementService.getAll$(),
			this.usersRepository.connectedUser$$,
		])
			.pipe(
				untilDestroyed(this),
				tap(([displayReadNotifications, notifications, connectedUser]) => {
					if (!connectedUser) return;
					this.notifications = [
						...notifications
							.reverse()
							.filter(
								(notification) =>
									notification.hasSeenByIds[connectedUser.id] === displayReadNotifications ||
									displayReadNotifications
							),
					];
					this._check();
				})
			)
			.subscribe();
	}

	private _check(timeOut = 0) {
		setTimeout(() => {
			this.cdr.detectChanges();
		}, timeOut);
	}
}
