import { Injectable } from '@angular/core';
import { Order, selectPersistStateInit } from '@datorama/akita';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GrantsManagementService, GroupsManagementService } from '@rumble-pwa/groups-system';
import { Subscription, SubscriptionsQuery, SubscriptionsService } from '@rumble-pwa/mega-store';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { sum } from 'lodash';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, take, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class SubscriptionsManagementService {
	subscriptions$$: BehaviorSubject<Subscription[]>;
	selectAll = this.subscriptionsQuery.selectAll;

	constructor(
		private restService: RestService,
		private subscriptionsService: SubscriptionsService,
		private subscriptionsQuery: SubscriptionsQuery,
		private _usersRepository: UsersRepository,
		private notificationsService: NotificationsService,
		private groupsManagementService: GroupsManagementService,
		private grantsManagementService: GrantsManagementService,
		private _amplitudeService: AmplitudeService
	) {
		this.subscriptions$$ = this.subscriptionsQuery.subscriptions$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});

		// gets the user's subscriptions and the user data, then saves it in amplitude
		combineLatest([this.subscriptions$$, this._usersRepository.connectedUser$$])
			.pipe(
				tap(([subscriptions, user]) => {
					const subscriptionsNamesToSend = subscriptions
						.filter(
							(subscription) =>
								subscription && subscription.state != 'deleted' && subscription.state != 'archived'
						)
						.map((subscription) => (subscription.name ? subscription.name : 'no name subscription'));
					this._amplitudeService.updateUser(user, subscriptionsNamesToSend);
				})
			)
			.subscribe();
	}

	pullData() {
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				// get subscriptions data from server
				this.restService.get<Subscription[]>('/subscriptions').subscribe((subscriptionApis) => {
					this.subscriptionsService.set(
						subscriptionApis.map((subscriptionApi) => {
							return { ...subscriptionApi, operation: 'refresh' };
						})
					);
				});
			}
		});
	}
	pullDataOnce() {
		this._usersRepository.isConnected$$.pipe(take(1)).subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				// get subscriptions data from server
				this.restService.get<Subscription[]>('/subscriptions').subscribe((subscriptionApis) => {
					this.subscriptionsService.set(
						subscriptionApis.map((subscriptionApi) => {
							return { ...subscriptionApi, operation: 'refresh' };
						})
					);
				});
			}
		});
	}

	pushData() {
		this.subscriptionsQuery.subscriptionsToSync$.pipe(debounceTime(1000)).subscribe((subscriptions) => {
			subscriptions.forEach((subscription) => {
				if (subscription?.operation === 'creation') {
					this._postToServer(subscription);
				} else if (subscription?.operation === 'update') this._putToServer(subscription);
			});
		});
	}

	public add(data: Subscription) {
		this.subscriptionsService.add(data);
	}
	public update(id: string, data: Partial<Subscription>) {
		this.subscriptionsService.update(id, data);
	}
	public removeFromStore(id: string) {
		this.subscriptionsService.remove(id);
	}
	public delete(id: string) {
		this.subscriptionsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.subscriptionsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.subscriptionsService.update(id, { state: 'default' });
	}

	public getAll$() {
		return this.subscriptionsQuery.subscriptions$;
	}

	public getAll() {
		return this.subscriptionsQuery.subscriptions$$.getValue();
	}

	public get(id: string) {
		return this.subscriptionsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.subscriptionsQuery.selectEntity(id);
	}

	public getAvailablePagesNumber() {
		return sum(
			this.getAll()
				.filter((subscriptions) => (subscriptions?.maxAvailablePages ?? 0) - (subscriptions?.usedPages ?? 0) > 0)
				.map((subscription) => {
					return (subscription.maxAvailablePages ?? 0) - (subscription.usedPages ?? 0);
				})
		);
	}

	//
	// SERVER SYNC
	//
	private _putToServer(subscription: Subscription) {
		return this.restService
			.put<Subscription>('/subscriptions/' + subscription.id, subscription)
			.pipe(
				tap((r) => {
					this.subscriptionsService.upsert({ ...r, operation: 'refresh' });
				}),
				catchError((err) => {
					console.log({ err });

					this.notificationsService.warning(
						err.error?.detail ?? 'An error occured during the operation.',
						'Error',
						undefined,
						undefined,
						20000
					);
					return of();
				})
			)
			.subscribe();
	}
	private _postToServer(subscription: Subscription) {
		return this.restService
			.post<Subscription>('/subscriptions', subscription)
			.pipe(
				tap((r) => {
					this.subscriptionsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	public addBeneficiaryToSubscription(subscriptionId: string, beneficiaryId: string) {
		this.restService
			.put<Subscription>('/subscriptions/' + subscriptionId + '/beneficiary/' + beneficiaryId, {})
			.pipe(
				tap((subscription) => {
					this.subscriptionsService.upsert({ ...subscription, operation: 'refresh' });
					this.grantsManagementService.pullDataOnce();
				}),
				catchError((err) => {
					console.log({ err });

					this.notificationsService.warning(
						err.error?.detail ?? 'An error occured during the operation.',
						'Error',
						undefined,
						undefined,
						20000
					);
					return of();
				})
			)
			.subscribe();
	}

	getSubscriptionsAsBeneficiary$(groupId: string, grantMapping?: string) {
		return this.subscriptionsQuery
			.selectAll({
				sortBy: 'timeCreation',
				sortByOrder: Order.DESC,
				filterBy: (subscription) => {
					const stateIsDefault = ['deleted', 'archived'].indexOf(subscription.state || 'default') == -1;
					if (grantMapping && subscription.grantMapping !== grantMapping) return false;
					return stateIsDefault;
				},
			})
			.pipe(
				// tap((subscriptions) => {
				// 	console.log('getSubscriptionsAsBeneficiary$', { subscriptions });
				// }),
				switchMap((subscriptions) => {
					const updatedSub = subscriptions.map((subscription) => {
						return this.groupsManagementService
							.get$(subscription.beneficiaryId)
							.pipe(map((group) => ({ group, subscription })));
					});
					return combineLatest(updatedSub);
				}),
				// tap((subscriptionsWithBeneficiaryGroup) => {
				// 	console.log('getSubscriptionsAsBeneficiary$', { subscriptionsWithBeneficiaryGroup });
				// }),
				map((subscriptionsWithBeneficiaryGroup) => {
					return subscriptionsWithBeneficiaryGroup
						.map((subscriptionWithBeneficiaryGroup) => {
							const groupIsBeneficiary = subscriptionWithBeneficiaryGroup.subscription.beneficiaryId == groupId;
							const groupIsChildOfBeneficiary =
								subscriptionWithBeneficiaryGroup.group?.childIds?.includes(groupId);
							if (groupIsBeneficiary || groupIsChildOfBeneficiary)
								return subscriptionWithBeneficiaryGroup.subscription;
							return undefined;
						})
						.filter((subscription): subscription is Subscription => !!subscription);
				})
			);
	}
}
