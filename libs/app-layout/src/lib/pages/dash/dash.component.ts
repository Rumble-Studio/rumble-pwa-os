/* eslint-disable @typescript-eslint/no-inferrable-types */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { gitLogs } from '@rumble-pwa/admin';
import { MetaDataService, ResizeEvent } from '@rumble-pwa/atomic-system';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { GlobalPlayerService } from '@rumble-pwa/global-player';
import { PermissionService } from '@rumble-pwa/groups-system';
import { I18nService } from '@rumble-pwa/i18n';
import { CNAME_LAYOUT_PROPS, INITIAL_LAYOUT_PROPS, LayoutProps, LayoutRepository, PageSegment } from '@rumble-pwa/layout/state';
import { LinkCategory, SideNavLink } from '@rumble-pwa/links/models';
import { LinksService } from '@rumble-pwa/links/services';
import { GrantsQuery, Notification, SubscriptionData } from '@rumble-pwa/mega-store';
import { AmplitudeService, AMPLITUDE_EVENTS } from '@rumble-pwa/monitoring-system';
import { NotificationsManagementService } from '@rumble-pwa/notifications-system';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { isEqual, sum } from 'lodash';
import { combineLatest, of } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-dash',
	templateUrl: './dash.component.html',
	styleUrls: ['./dash.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	// quota
	usedSeats = 0;
	maxSeats = 0;

	durationExported = 0;
	maxDurationExported = 0;

	// menu
	linksAll: SideNavLink[] = [];

	linksBottom: SideNavLink[] = [];
	interviewEditorMode = false;
	showDashboard = true;

	profile: User | null = null;
	isSuperuser = false;
	isSupportUser = false;

	gitLogs = gitLogs;

	globalPlayerDragPosition = { x: 0, y: 0 };

	profilePictureUrl: string | undefined;

	topMenuItem?: SideNavLink = {
		name: 'Home',
		shortName: 'Home',
		description: 'Go to the dashboard',
		matIcon: 'home',
		path: '/',
		displayIn: ['top'],
	};

	componentReady = false;

	// Subscriptions details
	hasActiveSubscription?: boolean;

	// AppSumo details
	hasAppSumoSubscription = false;
	appSumoUpgradeUrl?: string = undefined;

	// Notifications details
	lastNotifications: Notification[] = [];
	numberOfNotificationsUnseen = 0;

	public layoutProps: LayoutProps = INITIAL_LAYOUT_PROPS;
	@ViewChild('burgerMenuTriggerHidden') burgerMenuTriggerHidden?: MatMenuTrigger;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		public dialog: MatDialog, //
		private _usersRepository: UsersRepository,
		// private _notificationsService: NotificationsService,
		private _permissionService: PermissionService,
		public filesRepository: FilesRepository,
		private _router: Router,
		// private _brokerService: BrokerService,
		private _amplitudeService: AmplitudeService,
		private _notificationsManagementService: NotificationsManagementService,
		private _subscriptionsManagementService: SubscriptionsManagementService,
		private _globalPlayerService: GlobalPlayerService,
		public layoutRepository: LayoutRepository,
		// private _brandsRepository: BrandsRepository,
		private _linksService: LinksService,
		private _formsManagementService: FormsManagementService,
		private _grantsQuery: GrantsQuery,
		private _metaDataService: MetaDataService,
		private _i18nService: I18nService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		console.log('%cdashConstructor', 'color: #00ff00; font-weight: bold;', window.location.hostname);

		// Detect if main domain of the app or not (for whitelabel features)
		const cnamed = !(window.location.origin.includes('localhost') || window.location.origin.includes('app.rumble.studio'));
		this.layoutRepository.setLayoutProps({
			...(cnamed ? CNAME_LAYOUT_PROPS : {}),
			hostname: window.location.hostname,
			cnamed,
		});
		if (!cnamed) {
			this._metaDataService.setRumbleFavicon();
		}

		// update layout repo url (for whitelabel features)
		this._router.events.subscribe(() => {
			if (this._router.url != this.layoutProps.url)
				this.layoutRepository.setLayoutProps({
					url: this._router.url,
				});
		});

		// this.linksAll = this._linksService.SIDENAVLINKS;
		// console.log({ linksAll: this.linksAll });

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				// subscribe to unread notifications
				this._notificationsManagementService
					.getAll$()
					.pipe(
						untilDestroyed(this),
						tap((notifications) => {
							// display last 20 notifications
							this.lastNotifications = [...notifications.slice(0, 20)];
							this.numberOfNotificationsUnseen = this.lastNotifications.filter(
								(notification) => this.profile && !notification.hasSeenByIds[this.profile.id]
							).length;

							this._check();
						})
					)
					.subscribe();

				// all links
				this.layoutRepository.layoutProps$
					.pipe(
						untilDestroyed(this),
						switchMap((props) => {
							if (props.sideNavLinks) {
								return combineLatest(
									props.sideNavLinks.map((link) => {
										if (link.permissionDetails?.permissionKey) {
											return this._permissionService.can$(link.permissionDetails.permissionKey).pipe(
												map((can) => {
													return { link, can };
												})
											);
										}
										return of({ link, can: true });
									})
								);
							}
							return of([]);
						}),
						untilDestroyed(this),
						tap((results) => {
							this.linksAll = results.filter((result) => result.can).map((result) => result.link);
							this._check();
						})
					)
					.subscribe();
				// combineLatest(
				// 	this.layoutRepository.la.SIDENAVLINKS.map((link) => {
				// 		if (link.permissionDetails?.permissionKey) {
				// 			return this._permissionService.can$(link.permissionDetails.permissionKey).pipe(
				// 				map((can) => {
				// 					return { link, can };
				// 				})
				// 			);
				// 		}
				// 		return of({ link, can: true });
				// 	})
				// )
				// 	.pipe(
				// 		untilDestroyed(this),
				// 		tap((results) => {
				// 			this.linksAll = results.filter((result) => result.can).map((result) => result.link);
				// 			this._check();
				// 		})
				// 	)
				// 	.subscribe();

				// subscribe to profile changes
				this._usersRepository.connectedUser$$
					.pipe(
						untilDestroyed(this),
						filter((profile) => !isEqual(profile, this.profile)),
						tap((profile) => {
							this.profile = profile;
							// super user state
							this.isSuperuser = !!profile?.isSuperuser;
							// update profile picture
							this.profilePictureUrl = this._usersRepository.getUserAvatar(profile);

							this.componentReady = true;
						}),
						tap(() => this._check())
					)

					.subscribe();

				// is support user
				this._grantsQuery.grants$$
					.pipe(
						tap((grants) => {
							this.isSupportUser = grants.some(
								(grant) => grant.permissionId === 'is-support-user' && grant.state === 'default'
							);
						})
					)
					.subscribe();

				// update quota
				this._usersRepository.connectedUser$$
					.pipe(
						untilDestroyed(this),
						switchMap((connectedUser) => {
							const userId = connectedUser?.id;
							if (!userId) return of([]);
							return this._subscriptionsManagementService.getSubscriptionsAsBeneficiary$(userId);
						}),
						tap((subscriptions) => {
							this.hasAppSumoSubscription = subscriptions.some(
								(subscription) => subscription.source === 'appsumo'
							);
							this.usedSeats = sum(subscriptions.map((subscription) => subscription.usedSeats ?? 0));
							this.maxSeats = sum(subscriptions.map((subscription) => subscription.maxAvailableSeats ?? 0));

							this.durationExported = sum(
								subscriptions.map((subscription) => subscription.durationExported ?? 0)
							);
							this.maxDurationExported = sum(
								subscriptions.map((subscription) => subscription.maxDurationExported ?? 0)
							);

							// if user has tier3 we do not display the upgrade button (no upgrade above)
							const appSumoSubscriptionBelowTier3 = subscriptions.find(
								(subscription) =>
									subscription.source === 'appsumo' && subscription.grantMapping !== 'rumblestudio_tier3'
							);
							if (appSumoSubscriptionBelowTier3) {
								const dataAsStr = appSumoSubscriptionBelowTier3.data;
								if (dataAsStr) {
									const data = JSON.parse(dataAsStr) as SubscriptionData;
									if (data.operations) {
										// get most recent
										const mostRecentOperationKey = Object.keys(data.operations).sort().pop();
										if (mostRecentOperationKey) {
											const mostRecentOperationUuid =
												data.operations[mostRecentOperationKey].invoiceItemUuid;
											this.appSumoUpgradeUrl = this._getAppSumoUpgradeUrl(mostRecentOperationUuid);
										}
									}
								}
							}
						})
					)
					.subscribe();
			});

		// this.permissionsManagementService.serverReached$$
		//   .pipe(
		//     untilDestroyed(this),
		//     tap((serverReached) => {
		//       // console.log('Permission server reached:', serverReached);
		//     })
		//   )
		//   .subscribe();

		// this._brokerService.broker$
		// 	.pipe(
		// 		untilDestroyed(this),
		// 		tap((msg) => {
		// 			if (msg === 'create-branding-kit') {
		// 				this.createAnewBrand();
		// 			} else if (msg === 'create-interview') {
		// 				this.createANewForm();
		// 			}
		// 		})
		// 	)
		// 	.subscribe();

		// layout repository
		this.layoutRepository.layoutProps$
			.pipe(
				untilDestroyed(this),
				tap((props) => {
					this.layoutProps = props;
					this._check();
				})
			)
			.subscribe();
		this.layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'open-main-menu') {
						this.burgerMenuTriggerHidden?.openMenu();
					}
				})
			)
			.subscribe();
	}

	openProfileSettings() {
		this._router.navigateByUrl('/profile');
	}

	createANewForm() {
		this._amplitudeService.saveEvent(AMPLITUDE_EVENTS['open-modal-create-interview-dash']);
		this.openFormPromptEditor();
	}

	// Opens a pompt to create a form
	openFormPromptEditor() {
		this._formsManagementService
			.openPromptEditor({
				modalTitle: 'Create a new interview',
				modalDescription: 'An interview is the first way to get audio from your guests.',
				modalSubmitText: 'Save',
			})
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						this._router.navigate(['/forms/editor/' + result.id]);
					}
				})
			)
			.subscribe();
	}

	public can$(permission: string) {
		return this._permissionService.can$(permission).pipe(untilDestroyed(this));
	}

	notificationMenuClosed() {
		this.toggleAllUnseeNotifications();
	}
	refreshNotifications() {
		console.log('%c[dashComponent] notificationMenuOpened', 'color:green');

		this._notificationsManagementService.pullDataOnce();
	}

	toggleAllUnseeNotifications() {
		this.lastNotifications.forEach((notification) => {
			notification.concernedGroupIds.forEach((notificationGroupId) => {
				if (notification.hasSeenByIds[notificationGroupId] === false)
					this._notificationsManagementService.toggleHasSeen(notification.id, true);
			});
		});
	}

	processNotificationClick(notification: Notification) {
		this._notificationsManagementService.processNotificationClick(notification);
	}

	toMinuteStr(seconds?: number) {
		if (!seconds) return '0mn';
		const minutes = Math.round(seconds / 60);
		return minutes + 'mn';
	}

	getLinksByTarget(target: LinkCategory['target']) {
		const filteredLinks = this.linksAll.filter((link) => link.displayIn?.includes(target) && this.canAccessLink(link));
		return filteredLinks;
	}

	canAccessLink(link: SideNavLink) {
		const hasToBeSuperUser = link.superUserOnly;
		const hasToBeSupportUser = link.supportUserAccess;

		return (
			(!hasToBeSuperUser && !hasToBeSupportUser) ||
			(hasToBeSuperUser && this.isSuperuser) ||
			(hasToBeSupportUser && this.isSupportUser)
		);
	}

	private _getAppSumoUpgradeUrl(invoiceItemUuid: string) {
		const upgradeRoute = 'https://appsumo.com/account/redemption/' + invoiceItemUuid + '#change-plan';
		// console.log('app sumo user wants to upgrade', upgradeRoute);
		return upgradeRoute;
	}

	public validate(event: ResizeEvent): boolean {
		const MIN_WIDTH_PX: number = 280;
		const MIN_HEIGHT_PX: number = 200;
		if (
			event.rectangle.width &&
			event.rectangle.height &&
			(event.rectangle.width < MIN_WIDTH_PX || event.rectangle.height < MIN_HEIGHT_PX)
		) {
			return false;
		}
		return true;
	}

	public updateGlobalPlayerHeight(event: ResizeEvent) {
		this._globalPlayerService.updateSettings({
			customHeight: event.rectangle.height,
		});
	}

	public processPageClick(pageSegment: PageSegment) {
		if (!pageSegment.eventName) return;
		this.layoutRepository.emitEvent(pageSegment.eventName);
	}

	// /**
	//  * Utils function for todo to check if an interview was already created before
	//  */
	// // eslint-disable-next-line @typescript-eslint/no-unused-vars
	// public hasOneInterview = (_todo: Todo) => {
	// 	return this._formsManagementService.forms$$.value.filter((f) => f.ownerId == this.profile?.id).length > 0;
	// };

	/**
	 * called when a menu is opened or closed. Registers category in layout repo.
	 * @param linkCategory category to modify
	 */
	public toggleCollapse(linkCategory: LinkCategory) {
		this._linksService.updateCollapsedState(linkCategory, false);
	}
}
