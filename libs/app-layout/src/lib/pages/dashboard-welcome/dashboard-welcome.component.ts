import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Brand, BrandsRepository } from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FormOpenerData, FormOpenerPromptComponent } from '@rumble-pwa/forms-layout';
import { FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { GrantsManagementService, PermissionService } from '@rumble-pwa/groups-system';
import { LayoutProps, LayoutRepository, LAYOUT_FOR_DASHBOARD } from '@rumble-pwa/layout/state';
import { Form, Mix, RecordingSessionListItem, Subscription } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { ObjectDetails } from '@rumble-pwa/objects/prompt';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { DEMO_FORM_ID } from '@rumble-pwa/profile-system';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { User, UserData } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { cloneDeep, isEqual, sortBy } from 'lodash';
import { combineLatest, of } from 'rxjs';
import { catchError, debounceTime, filter, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-dashboard-welcome',
	templateUrl: './dashboard-welcome.component.html',
	styleUrls: ['./dashboard-welcome.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWelcomeComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	profile: User | null = null;
	lastGuests?: RecordingSessionListItem[] = undefined;
	lastOwnedRecordingSessions: RecordingSessionListItem[] = [];
	lastMixes: Mix[] = [];

	grantsLoaded = false;

	getToKnowYouModalAlreadyOpened = false;
	checkForDemoFormCalled = false;

	forms: Form[] = [];

	subscriptions: Subscription[] = [];

	layoutProps?: LayoutProps;

	/** Get loaded with the profile */
	objectDetailsKYC?: ObjectDetails<UserData>;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		public dialog: MatDialog,
		private _formsManagementService: FormsManagementService,
		private _permissionService: PermissionService,
		private _grantsManagementService: GrantsManagementService,
		private _usersRepository: UsersRepository,
		private _recordingSessionsManagementService: RecordingSessionsManagementService,
		private _mixesManagementService: MixesManagementService,
		private _subscriptionsManagementService: SubscriptionsManagementService,
		private _router: Router,
		private _layoutRepository: LayoutRepository,
		private _notificationsService: NotificationsService,
		private _brandsRepository: BrandsRepository,
		private _filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activateRoute);

		this._layoutRepository.layoutProps$
			.pipe(
				tap((layoutProps) => {
					this.layoutProps = layoutProps;
				})
			)
			.subscribe();

		selectPersistStateInit()
			.pipe(
				untilDestroyed(this),
				take(1),
				tap(() => {
					// get mixes to display list
					this._mixesManagementService.mixes$$
						.pipe(
							untilDestroyed(this),
							tap((mixes) => {
								this.lastMixes = sortBy(
									[...mixes.filter((mix) => (mix.state ?? 'default') === 'default')],
									['timeCreation']
								).reverse();
								this._check();
							})
						)
						.subscribe();

					// check if no subscription to display a message
					this._subscriptionsManagementService.subscriptions$$
						.pipe(
							untilDestroyed(this),
							tap((subscriptions) => {
								this.subscriptions = cloneDeep(
									subscriptions.filter((subscription) => subscription.state === 'default')
								);
							})
						)
						.subscribe();

					// are grants looaded?
					this._grantsManagementService.grantsLoaded$$
						.pipe(
							untilDestroyed(this),
							// delay(4000),
							tap((grantsLoaded) => {
								this.grantsLoaded = grantsLoaded;
								this._check();
							})
						)
						.subscribe();

					// fill forms info
					combineLatest([this._formsManagementService.forms$$, this._usersRepository.connectedUser$$])
						.pipe(
							untilDestroyed(this),
							tap(([forms, profile]) => {
								this.forms = sortBy(
									forms
										.filter((form) => form.ownerId === profile?.id)
										.filter((form) => (form.state ?? 'default') === 'default'),
									['timeUpdate']
								).reverse();
								this._check();
							})
						)
						.subscribe();

					// fill last owned recording sessions and last guests
					combineLatest([
						this._recordingSessionsManagementService.recordingSessions$$,
						this._usersRepository.connectedUser$$,
						this._filesRepository.accessibleEntityFiles$,
					])
						.pipe(
							debounceTime(200),

							switchMap(([recordingSessions]) => {
								return combineLatest(
									recordingSessions.map((recordingSession) =>
										this._recordingSessionsManagementService
											.getRecordingSessionListItem$(recordingSession.id)
											.pipe(startWith(null))
									)
								);
							}),
							untilDestroyed(this),
							debounceTime(200),
							tap((recordingSessionItems) => {
								this.lastGuests = sortBy(
									recordingSessionItems
										.filter((child): child is RecordingSessionListItem => !!child)
										.filter(
											(recordingSessionListItem) =>
												recordingSessionListItem.form.ownerId ==
													this._usersRepository.connectedUser$$.getValue()?.id &&
												recordingSessionListItem.recordingSession.ownerId !=
													this._usersRepository.connectedUser$$.getValue()?.id &&
												recordingSessionListItem.recordingSession.state === 'default' &&
												recordingSessionListItem.form.state === 'default'
										)
										.map((recordingSessionListItem) => {
											const recordingSessionItemWithDuration: RecordingSessionListItem = {
												...recordingSessionListItem,
												duration: this._recordingSessionsManagementService.getRecordingSessionDuration(
													recordingSessionListItem.recordingSession.id
												),
											};
											return recordingSessionItemWithDuration;
										}),
									'recordingSession.timeUpdate'
								).reverse();

								this.lastOwnedRecordingSessions = sortBy(
									recordingSessionItems
										.filter((child): child is RecordingSessionListItem => !!child)
										.filter(
											(recordingSessionListItem) =>
												recordingSessionListItem.form.ownerId !==
													this._usersRepository.connectedUser$$.getValue()?.id &&
												recordingSessionListItem.user.id ==
													this._usersRepository.connectedUser$$.getValue()?.id &&
												recordingSessionListItem.recordingSession.state === 'default' &&
												recordingSessionListItem.form.state === 'default'
										)
										.filter((recordingSessionListItem) => recordingSessionListItem.form.id !== DEMO_FORM_ID)
										.map((recordingSessionListItem) => {
											const recordingSessionItemWithDuration: RecordingSessionListItem = {
												...recordingSessionListItem,
												duration: this._recordingSessionsManagementService.getRecordingSessionDuration(
													recordingSessionListItem.recordingSession.id
												),
											};
											return recordingSessionItemWithDuration;
										}),
									'recordingSession.timeCreation'
								).reverse();
								this._check();
							})
						)
						.subscribe();

					// subscribe to profile changes and check for get to know you questions
					this._usersRepository.connectedUser$$
						.pipe(
							untilDestroyed(this),
							filter((profile) => !isEqual(profile, this.profile)),
							debounceTime(300),
							tap((profile) => {
								this.profile = profile;
								if (profile && profile.id) {
									// this.checkForGetToKnowYouQuestion();
									this.objectDetailsKYC = this._usersRepository.getObjectDetailsKYC();
									this._check();
									// this.checkForDemoForm();
								}
								if (!profile?.id) {
									this._router.navigate(['/auth/connexion']);
								}
							}),
							tap(() => {
								this._check();
							})
						)
						.subscribe();

					// update layout
					this._layoutService.layoutSize$$
						.pipe(
							untilDestroyed(this),
							tap(() => {
								this._layoutRepository.setLayoutProps(LAYOUT_FOR_DASHBOARD);
							})
						)
						.subscribe();
				})
			)
			.subscribe();
	}

	checkForDemoForm() {
		if (this.checkForDemoFormCalled || this.isMobile) return;
		this.checkForDemoFormCalled = true;

		const dataAsStr = this.profile?.data;
		if (!dataAsStr) return;
		const data: UserData = JSON.parse(dataAsStr);
		const formStates = data.history?.formStateList;
		const demoFormState = formStates?.[DEMO_FORM_ID];
		console.log('Demo form', { demoFormState, demoFormPostponed: this.layoutProps?.demoFormPostponed });

		if (
			(demoFormState && (demoFormState.state === 'completed' || demoFormState.state === 'closed')) ||
			this.layoutProps?.demoFormPostponed
		) {
			return;
		}

		this._notificationsService
			.confirm('Would you like to go through the demo interview?', undefined, 'Maybe later', 'Yes please')
			.pipe(
				switchMap((confirm) => {
					if (!confirm) {
						this._notificationsService.info('This demo interview is available in the Help section');
						this._layoutRepository.setLayoutProps({ demoFormPostponed: true });
						return of(undefined);
					}

					return this._formsManagementService.fetchFormData$(DEMO_FORM_ID).pipe(
						switchMap(() => this._formsManagementService.get$(DEMO_FORM_ID)),
						filter((form): form is Form => !!form),
						take(1),
						switchMap(() => {
							// to avoid multiple openning of the interview

							const data: FormOpenerData = {
								formId: DEMO_FORM_ID,
								confirmationMessage: 'You are leaving the demo interview.',
								closingMessage: 'You finished the demo interview.',
							};
							return this.dialog
								.open(FormOpenerPromptComponent, {
									height: '800px',
									maxHeight: '90%',
									minWidth: '300px',
									width: '800px',
									maxWidth: '90%',
									data,
								})
								.afterClosed();
						}),
						tap((afterCloseValue) => {
							console.log('afterCloseValue', afterCloseValue);
							const newData: UserData = {
								history: {
									formStateList: {
										[DEMO_FORM_ID]: {
											state: afterCloseValue ?? 'started',
										},
									},
								},
							};
							console.log('newData', newData);

							// const newData: UserData = {
							// 	[INTERVIEW_TO_DISPLAY]: 'closed',
							// };
							this._usersRepository.addDataToConnectedUser(newData);
							// // add formId true to user data
						}),
						// catch 404 error
						catchError((error) => {
							console.error('Error while opening demo interview:', error);
							return of(null);
						})
					);
				}),
				take(1),
				untilDestroyed(this)
			)
			.subscribe();
	}

	checkForGetToKnowYouQuestion() {
		if (this.getToKnowYouModalAlreadyOpened) return;

		this.getToKnowYouModalAlreadyOpened = true;

		this._usersRepository.launchKYCForm();
	}

	fillYourBrandDetail() {
		this._brandsRepository
			.openPromptEditor({ modalTitle: 'Create a new brand', modalSubmitText: 'Create' })
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result && result.name) {
						const newBrand: Brand = {
							...result,
							name: result.name || '',
							id: uuidv4(),
							ownerId: this._usersRepository.connectedUser$$.getValue()?.id || '',
							colors: '#c2c2c2;#ffffff',
							domain: result.domain === 'https://' ? undefined : result.domain,
						};
						this._brandsRepository.addBrand(newBrand);
					}
				})
			)
			.subscribe();
	}
	// Opens a pompt to create a form
	public openFormPromptEditor() {
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
		return this._permissionService.can$(permission).pipe(
			map((can) => {
				return !!can;
			}),
			tap(() => this._check())
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public processTableClick(tableClickEvent: TableClickEvent<any>, path?: string) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate([path, tableClickEvent.object.id]);
	}

	public listenTo(recordingSessionId: string) {
		this._recordingSessionsManagementService.listenTo(recordingSessionId, 'welcome' + recordingSessionId);
	}

	public goToLink(url: string) {
		window.open(url, '_blank');
	}

	public getUserAvatar(user?: User) {
		return this._usersRepository.getUserAvatar(user);
	}

	public convertObjectToSearchableString(object: RecordingSessionListItem): string {
		const searchableString = JSON.stringify(object);
		return searchableString;
	}

	public processPromptResultEvent(result: Partial<UserData>) {
		this._usersRepository.addDataToConnectedUser(result);
	}

	public processPromptCancelEvent() {
		this.objectDetailsKYC = undefined;
	}

	public maFonction(text: string) {
		return text + ':';
	}
}
