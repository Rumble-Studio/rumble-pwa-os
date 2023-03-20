import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AdminPanelSystemService } from '@rumble-pwa/admin-panel-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Subscription } from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { ChangePlanPromptComponent } from '../change-plan-prompt/change-plan-prompt.component';

interface UserWithSubscriptions extends User {
	subscriptions: Subscription[];
	numberOfSubscriptions: number;
	connectAsLink?: string;
}
@UntilDestroy()
@Component({
	selector: 'rumble-pwa-users-list',
	templateUrl: './users-list.component.html',
	styleUrls: ['./users-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	users: UserWithSubscriptions[] = [];
	_searchValue$$ = new BehaviorSubject<string | undefined>(undefined);
	public set searchValue(newSearchValue) {
		this._searchValue$$.next(newSearchValue);
	}
	public get searchValue() {
		return this._searchValue$$.value;
	}

	refreshData$$ = new BehaviorSubject<boolean>(false);

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _adminPanelSystemService: AdminPanelSystemService,
		private _notificationsService: NotificationsService,
		private _dialog: MatDialog,
		private _groupsManagementService: GroupsManagementService
	) {
		super(_cdr, _layoutService, _activatedRoute);
		combineLatest([this._searchValue$$, this.refreshData$$])
			.pipe(
				debounceTime(1000),
				switchMap(([searchValue, _]) => {
					if (!searchValue) {
						this.users = [];
						return of(undefined);
					}

					return this._adminPanelSystemService
						.getUsersAndSubscriptionsWithSearchValue$(searchValue.trim().toLowerCase())
						.pipe(
							untilDestroyed(this),
							switchMap((usersAndSubscriptions) => {
								// We need to reset users array here because it will never falls into the tap() if length < 1
								if (usersAndSubscriptions.length < 1) this.users = [];

								const usersAndSubscriptionsWithConnectAsLink$: Observable<UserWithSubscriptions>[] =
									usersAndSubscriptions.map((userAndSubscriptions) => {
										return this._adminPanelSystemService
											.getConnectAsLink$(userAndSubscriptions.user.id)
											.pipe(
												map((link) => {
													const userAndSubscriptionsWithConnectAsLink: UserWithSubscriptions = {
														connectAsLink: link,
														...userAndSubscriptions.user,
														subscriptions: userAndSubscriptions.subscriptions.filter(
															(sub) => sub.state !== 'deleted'
														),
														numberOfSubscriptions: userAndSubscriptions.subscriptions.length,
													};
													return userAndSubscriptionsWithConnectAsLink;
												})
											);
									});
								return combineLatest(usersAndSubscriptionsWithConnectAsLink$);
							}),
							tap((usersAndSubscriptions) => {
								this.users = usersAndSubscriptions;
								this._check();
							})
						);
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	public connectAs(user: User) {
		this._adminPanelSystemService.connectAs(user.id);
	}

	public openChangePlanPrompt(userWithSubscriptions: UserWithSubscriptions, subscription?: Subscription) {
		// check if subscription's source is not from appsumo or custom
		if (subscription && ['appsumo', 'custom'].indexOf(subscription?.source ?? '') < 0) {
			this._notificationsService.error('You can not edit this kind of subscription');
			return;
		}
		this._dialog
			.open(ChangePlanPromptComponent, {
				maxHeight: '90%',
				minWidth: '300px',
				width: '800px',
				maxWidth: '90%',
				data: { subscription, userSubscriptions: userWithSubscriptions.subscriptions },
			})
			.afterClosed()
			.pipe(
				switchMap((newTier) => {
					if (newTier) {
						if (subscription)
							return this._adminPanelSystemService.changePlan$(
								userWithSubscriptions.id,
								subscription.id,
								newTier
							);
						else return this._adminPanelSystemService.addPlanWithEmail$(userWithSubscriptions.email, newTier);
					}
					return of(undefined);
				}),
				tap((newSubscription) => {
					if (newSubscription) {
						this.refreshData$$.next(true);
						this._notificationsService.success(
							userWithSubscriptions.email +
								': ' +
								(subscription
									? subscription.name + ' changed to ' + newSubscription.name
									: 'new ' + newSubscription.name + ' subscription')
						);
					}
				})
			)
			.subscribe();
	}

	deleteSubscription(subscription: Subscription, userWithSubscriptions: UserWithSubscriptions) {
		this._notificationsService
			.confirm(
				'Are you sure you want to delete this subscription?',
				this.groupAsBeneficiary(subscription)
					? 'This subscription belongs to a group. ' +
							userWithSubscriptions.fullName +
							' is not the only beneficiary!'
					: undefined
			)
			.pipe(
				switchMap((confirm) => {
					if (confirm) return this._adminPanelSystemService.deletePlan(subscription.id);
					else return of(undefined);
				}),
				tap((subscription) => {
					if (subscription) {
						this.refreshData$$.next(true);
						this._notificationsService.success(
							subscription.name + ' has been removed for ' + userWithSubscriptions.email
						);
					}
				})
			)
			.subscribe();
	}

	processCopyToClipboardEvent(copied: boolean, message = 'Copied to clipboard!') {
		if (copied) {
			this._notificationsService.success(message, undefined, undefined, undefined, 1000);
		} else {
			this._notificationsService.error('Error while copying');
		}
	}

	groupAsBeneficiary(subscription: Subscription) {
		return this._groupsManagementService.get(subscription.beneficiaryId)?.kind === 'team';
	}
}
