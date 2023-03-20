import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { applyTransaction } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Brand, BrandsRepository } from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { DomainsRepository } from '@rumble-pwa/domains/state';
import {
	ALL_STEP_INSTANCES,
	alreadyHasStep,
	DEFAULT_PROVIDERS,
	FormsManagementService,
	generateStepFromDetails,
	Provider,
	RecordingSessionsManagementService,
	StepDetail,
	StepInstance,
	StepsManagementService,
	STEP_CATEGORIES,
} from '@rumble-pwa/forms-system';
import { FormsRepository } from '@rumble-pwa/forms/state';
import { PermissionService } from '@rumble-pwa/groups-system';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import {
	DEFAULT_CUSTOMISATION_DETAILS,
	Form,
	FormCustomisationDetails,
	FormData,
	RecordingSessionListItem,
	Step,
	SYNCABLE_PROPERTIES,
} from '@rumble-pwa/mega-store';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { Page, PageData, PagesRepository } from '@rumble-pwa/pages/state';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { FavoriteObject, User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	DataObs,
	DataObsViaId,
	getRouteParam$,
	getRouteQueryParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
	updateInPlace,
} from '@rumble-pwa/utils';
import { clamp, cloneDeep, isEqual, sortBy } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, map, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { ExportPdfPromptComponent } from '../export-pdf-prompt/export-pdf-prompt.component';
import { MultiQuestionsPromptComponent, StepToAppend } from '../multi-questions-prompt/multi-questions-prompt.component';

export type PageAction = 'create' | 'preview' | 'invite' | 'listen' | null;

const PageActionIndex: PageAction[] = ['create', 'preview', 'invite', 'listen'];

export interface ExportDataToPDFPrompt {
	formUrl: string;
	customisationData?: FormCustomisationDetails;
	form?: Form;
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-dad-editor',
	templateUrl: './form-editor-dad.component.html',
	styleUrls: ['./form-editor-dad.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorDadComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, AfterViewInit, OnDestroy
{
	/* ---------------------
  |                       |
  |         STEPS         |
  |                       |
  | ---------------------- */

	// source
	sourceStepInstances: StepInstance[] = [];
	favoriteSteps: Step[] = [];
	filterFavoriteStepsOptions: { stepInstance: StepInstance; checked: boolean }[] = ALL_STEP_INSTANCES.map((STEP_INSTANCE) => {
		return { stepInstance: STEP_INSTANCE, checked: true };
	}).filter((STEP_INSTANCE) => STEP_INSTANCE.stepInstance.stepDetail.menuText);

	_favoriteStepsFilter$$ = new BehaviorSubject<string[]>([]);

	public set favoriteStepsFilter(newfavoriteStepsFilter) {
		this._favoriteStepsFilter$$.next(newfavoriteStepsFilter);
	}
	public get favoriteStepsFilter() {
		return this._favoriteStepsFilter$$.value;
	}

	// current steps of the form
	private _basketSteps: Step[] = [];
	public get basketSteps() {
		return this._basketSteps;
	}
	public set basketSteps(value) {
		const form = this.form$$$.value;
		if (!form) return;

		if (isEqual(this._basketSteps, value)) return;

		const updated = updateInPlace(
			this._basketSteps,
			value,
			SYNCABLE_PROPERTIES
			// 'basketSteps'
		);

		if (updated) {
			this.updateSteps();
		}
	}

	// sort categories per priority
	STEP_CATEGORIES = Object.entries(STEP_CATEGORIES).sort(([, a], [, b]) => (a.priority > b.priority ? 1 : -1));

	/* --------------------- */

	/* ---------------------
  |                       |
  |      DISPLAY          |
  |                       |
  | ---------------------- */

	collapseAll? = false;
	stepMenuMaximized = true;
	@ViewChild('addStepContainer') _addStepContainer?: ElementRef;

	// shared providers
	providers = DEFAULT_PROVIDERS;
	selectedProviders: Provider[] = [...DEFAULT_PROVIDERS.filter((p) => p.id === 'creator' || p.id === 'default-participant')];

	pages: Page[] = [];

	private _selectedPage?: Page;
	public get selectedPage() {
		return this._selectedPage;
	}
	public set selectedPage(value) {
		this._selectedPage = value;
		const domainUrl = this.getDomainUrlById(value?.domainId);
		const pattern = value?.pattern;
		if (domainUrl && pattern) {
			this.formUrl = domainUrl + pattern;
		} else {
			this.form$$$.id ? this.updateFormUrl(this.form$$$.id) : (this.formUrl = '');
		}
	}

	sectionActionIndex = 0;
	// menu at the top
	private _selectedAction: PageAction = 'create';
	public get selectedAction() {
		return this._selectedAction;
	}
	public set selectedAction(value) {
		this._selectedAction = value;
		this._amplitudeService.saveEvent('form-editor:action-change', {
			action: value,
		});
		this.sectionActionIndex = PageActionIndex.findIndex((a) => a === value);
	}

	// sharing details
	formUrl = '';
	embeddingCode = '';

	// same as layoutSize but controllable by the user for preview
	previewLayoutSize = 2;

	nextCollapseState: true | undefined = true;

	availableForms: Form[] = [];

	numberNotCollapsed = 0;
	numberCollapsed = 0;

	numberOfAvailablePages = 0;

	/* --------------------- */

	/* ---------------------
  |                       |
  |      FORM DETAILS     |
  |                       |
  | ---------------------- */

	// interview data
	form$$$ = new DataObsViaId<Form>((formId: string) => this._formsManagementService.get$(formId));

	originalCustomisationData: FormCustomisationDetails = { ...DEFAULT_CUSTOMISATION_DETAILS };
	private _customisationData: FormCustomisationDetails = { ...DEFAULT_CUSTOMISATION_DETAILS };
	public get customisationData() {
		return this._customisationData;
	}
	public set customisationData(value) {
		this._customisationData = { ...value };
		this._check();
	}

	// form settings (read right)
	private _propertyInterviewPreventEditing = false;
	public get propertyInterviewPreventEditing() {
		return this._propertyInterviewPreventEditing;
	}
	public set propertyInterviewPreventEditing(newValue) {
		if (!this.canYouEdit) return;

		const value = !!newValue;
		if (this._propertyInterviewPreventEditing === value) return;
		this._propertyInterviewPreventEditing = value;
		const form = this.form$$$.value;
		if (!form) return;
		const formData: FormData = form.data ? JSON.parse(form.data) : {};
		formData.preventEditing = value;

		this._formsManagementService.update(form.id, {
			data: JSON.stringify(formData),
		});
	}
	// form settings (interview offline)
	private _propertyInterviewIsOffline = false;
	public get propertyInterviewIsOffline() {
		return this._propertyInterviewIsOffline;
	}
	public set propertyInterviewIsOffline(newValue) {
		const value = !!newValue;
		if (this._propertyInterviewIsOffline === value) return;

		this._propertyInterviewIsOffline = value;
		const form = this.form$$$.value;
		if (!form) return;
		const formData: FormData = form.data ? JSON.parse(form.data) : {};
		formData.isOffline = value;
		this._formsManagementService.update(form.id, {
			data: JSON.stringify(formData),
		});
	}

	public _matTabGroupActions?: MatTabGroup;
	@ViewChild('matTabGroupActions')
	public set matTabGroupActions(v) {
		this._matTabGroupActions = v;
		if (this.matTabGroupActions) {
			// this.matTabGroupActions._handleClick = this.interceptTabChange.bind(this);
		}
	}
	public get matTabGroupActions() {
		return this._matTabGroupActions;
	}

	// brands and selected brand
	brands$: Observable<Brand[]>;
	_brandid?: string | null;
	public set brandId(v) {
		if (this._brandid == v) return;
		this.updateFormBrand(v);
		this._brandid = v;
	}
	public get brandId() {
		return this._brandid;
	}

	// rights
	canYouEdit = true;
	canDisplayBrandMenu$$$ = new DataObs<boolean | undefined>(
		'menu-display-script',
		() => this._permissionService.can$('menu-display-brand').pipe(tap(() => this._check())),
		this._permissionService
		// 'canDisplay'
	);

	/* --------------------- */

	/* ---------------------
  |                       |
  |   RECORDING SESSIONS  |
  |                       |
  | ---------------------- */

	displayArchivedSessions$$ = new BehaviorSubject<boolean>(false);
	public get displayArchivedSessions() {
		return this.displayArchivedSessions$$.getValue();
	}
	public set displayArchivedSessions(value) {
		this.displayArchivedSessions$$.next(value);
	}

	displaySessionsWithAudioOnly$$ = new BehaviorSubject<boolean>(false);
	public get displaySessionsWithAudioOnly() {
		return this.displaySessionsWithAudioOnly$$.getValue();
	}
	public set displaySessionsWithAudioOnly(value) {
		this.displaySessionsWithAudioOnly$$.next(value);
	}

	recordingSessionListItems$$$ = new DataObsViaId((formId: string) =>
		this.displayArchivedSessions$$.pipe(
			switchMap((includeArchived: boolean) => {
				return this._recordingSessionsManagementService.getFormSessions$(formId, includeArchived);
			}),

			switchMap((recordingSessions) => {
				if (recordingSessions.length)
					return combineLatest(
						recordingSessions.map((recordingSession) =>
							this._recordingSessionsManagementService.getRecordingSessionListItem$(recordingSession.id)
						)
					);
				return of([]);
			}),
			switchMap((recordingSessionItems) => {
				return this.displaySessionsWithAudioOnly$$.pipe(
					map((displaySessionsWithAudioOnly) => {
						return recordingSessionItems
							.filter((child): child is RecordingSessionListItem => !!child)
							.map((recordingSessionItem) => {
								const recordingSessionItemWithDuration: RecordingSessionListItem = {
									...recordingSessionItem,
									duration: this._recordingSessionsManagementService.getRecordingSessionDuration(
										recordingSessionItem.recordingSession.id
									),
								};
								return recordingSessionItemWithDuration;
							})
							.filter(
								(recordingSessionItem) =>
									(displaySessionsWithAudioOnly && recordingSessionItem.duration) ||
									!displaySessionsWithAudioOnly
							);
					})
				);
			}),
			tap(() => {
				this._check();
			})
		)
	);

	/* --------------------- */

	// current user
	profile: User | null = null;

	_stepIdFocused: string | null | undefined;
	public set stepIdFocused(newStepIdFocused) {
		this._stepIdFocused = newStepIdFocused;
		this.updateDadParams();
	}
	public get stepIdFocused() {
		return this._stepIdFocused;
	}

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;

	private _centralTemplate?: TemplateRef<HTMLElement> | undefined;
	public get centralTemplate(): TemplateRef<HTMLElement> | undefined {
		return this._centralTemplate;
	}
	@ViewChild('centralTemplate')
	public set centralTemplate(value: TemplateRef<HTMLElement> | undefined) {
		this._centralTemplate = value;
		this._layoutRepository.centralTemplate = value;
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _dialog: MatDialog,
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _stepsManagementService: StepsManagementService,
		private _formsManagementService: FormsManagementService,
		private _recordingSessionsManagementService: RecordingSessionsManagementService,
		// private shepherdService: ShepherdService, // private storageService: StorageService
		private _permissionService: PermissionService,
		private _router: Router,
		private _location: Location,
		private _brandsRepository: BrandsRepository,
		private _amplitudeService: AmplitudeService,
		private _el: ElementRef<HTMLElement>,
		private _formsRepository: FormsRepository,
		private _layoutRepository: LayoutRepository,
		private _pagesRepository: PagesRepository, // used for shared tabs > page card
		private _domainRepository: DomainsRepository, // used to get the right link from domain id
		private _subscriptionsManagementService: SubscriptionsManagementService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.numberOfAvailablePages = this._subscriptionsManagementService.getAvailablePagesNumber();

		// reset floating menu when changing layout size
		this._layoutService.layoutSize$
			.pipe(
				untilDestroyed(this),
				tap(() => {
					if (this._addStepContainer) this._addStepContainer.nativeElement.style.transform = 'unset';
				})
			)
			.subscribe();

		// forms: list all for top menu
		this._formsManagementService
			.getAllAccessible$()
			.pipe(
				untilDestroyed(this),
				tap((forms) => {
					this.availableForms = cloneDeep(forms);
					if (this.form$$$.value && forms.every((form) => form.id != this.form$$$.id)) {
						this.availableForms.push(this.form$$$.value);
					}
					this._check();
				})
			)
			.subscribe();

		// brands: list all for form customization
		this.brands$ = this._brandsRepository.brands$;

		// recording session: save userId to add "you" tag and select host as user for preview
		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((profile) => {
					this.profile = profile;
					this.canYouEdit = profile?.id === this.form$$$.value?.ownerId;
					this._check();
				})
			)
			.subscribe();

		// form: check canYouEdit
		combineLatest([this._usersRepository.connectedUser$$, this.form$$$.$])
			.pipe(
				untilDestroyed(this),
				tap(([conntedUser, form]) => {
					if (conntedUser) {
						this.canYouEdit = conntedUser?.id === form?.ownerId;
						if (!this.canYouEdit) {
							this._notificationsService.warning(
								"Your edits won't be saved",
								'Not owner of this form',
								undefined,
								undefined,
								-1
							);
						}
					}
					this._check();
				})
			)
			.subscribe();

		// React to layoutSize to hide guest provider when too small
		this._layoutService.layoutSize$.pipe(untilDestroyed(this)).subscribe(() => {
			// if layout size too small: remove provider
			if (this.isMobile) {
				this.processProviderSelection([...DEFAULT_PROVIDERS.filter((p) => p.id === 'creator')]);
			}
			this._check();
		});

		// read param from route to update form$$$ and recordingSessionListItems$$$
		getRouteParam$(this._activatedRoute, 'formId')
			.pipe(
				untilDestroyed(this),
				tap((formId) => {
					if (formId && formId.length > 36) {
						this._notificationsService.warning('Interview not found.');
						this._router.navigate(['/forms']);
					}
					this.form$$$.id = formId;
					this.recordingSessionListItems$$$.id = formId;
					this._formsRepository.setActiveId(formId ?? '');
					this._check();
				})
			)
			.subscribe();

		// get drawer from url
		getRouteQueryParam$(this._activatedRoute, 'drawer')
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this._check();
				})
			)
			.subscribe();

		// get action from url
		getRouteQueryParam$(this._activatedRoute, 'action')
			.pipe(
				untilDestroyed(this),
				tap((action) => {
					this.selectedAction = (action as PageAction) ?? 'create';
					this.updateMenuDisplay(this.selectedAction);
				})
			)
			.subscribe();

		// get step id from url (useful on refresh)
		getRouteQueryParam$(this._activatedRoute, 'stepId')
			.pipe(
				untilDestroyed(this),
				tap((stepId) => {
					this._formsRepository.setFormProps({ stepIdFocused: stepId });
				})
			)
			.subscribe();

		// subscribe to formsRepository to get current stepIdFocused
		this._formsRepository.formProps$
			.pipe(
				untilDestroyed(this),
				tap((formProps) => {
					this.stepIdFocused = formProps.stepIdFocused;
				})
			)
			.subscribe();

		// subscribe to recordingSessions for diplay
		this.recordingSessionListItems$$$.$.pipe(
			untilDestroyed(this),
			tap(() => {
				this._check();
			})
		).subscribe();

		// update sharing url, isLive state, sharedWith
		this.form$$$.$.pipe(untilDestroyed(this)).subscribe((form) => {
			if (form) {
				this.updateFormUrl(form.id);
				this.updateEmbeddingCode(form.id);

				this.brandId = form.brandId;

				// form data
				const data: FormData = form.data ? JSON.parse(form.data) : {};

				const customisationDataToUse: FormCustomisationDetails =
					data.customisationDetails ?? DEFAULT_CUSTOMISATION_DETAILS;
				customisationDataToUse.brandId = this.brandId;

				this.customisationData = customisationDataToUse;
				this.originalCustomisationData = customisationDataToUse;
				this._propertyInterviewIsOffline = !!data.isOffline;
				this._propertyInterviewPreventEditing = !!data.preventEditing;
				if (this._propertyInterviewPreventEditing && this.selectedAction === 'create') {
					this.selectedAction = 'listen';
				}
				this._check();
			}
		});

		// fill the source steps
		this.sourceStepInstances = ALL_STEP_INSTANCES;

		// fill the basket steps from the store
		this.form$$$.$.pipe(
			untilDestroyed(this),
			switchMap((form) => {
				if (!form) return of([]);
				return this._stepsManagementService.getFormSteps$(form.id);
			}),
			debounceTime(100),
			tap((steps: Step[]) => {
				this.basketSteps = steps.map((step) => ({
					...step,
				}));
				this.nextCollapseState = undefined;
				this._check();
			})
		).subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.form$$$.$.pipe(
			untilDestroyed(this),
			tap((form) => {
				if (form) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Interviews',
								link: '/forms',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-forms-menu',
							},
							{
								title:
									(form.title ?? '(untitled)') + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-form-editor',
								tooltip: 'Edit interview properties',
							},
						],
					});
				}
			})
		).subscribe();
		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					const formId = this.form$$$.id;
					if (event === 'open-form-editor' && formId) {
						this.openFormPromptEditor(formId);
					} else if (event === 'display-other-forms-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();

		const favoriteStepsFilter = ALL_STEP_INSTANCES.map((STEP_INSTANCE) => STEP_INSTANCE.stepDetail.name).filter(
			(STEP_INSTANCE) => STEP_INSTANCE
		);

		this._favoriteStepsFilter$$.next(favoriteStepsFilter);

		const favoritesSteps$ = this._usersRepository.connectedUserFavorite$$.pipe(
			map((favorites) => {
				return (
					favorites?.filter((favorite) => favorite.objectKind === 'step').filter((favorite) => favorite.isFavorite) ??
					[]
				);
			}),
			switchMap((favorites: FavoriteObject[]) => {
				const steps$ = favorites.map((favorite) => this._stepsManagementService.get$(favorite.objectId));
				return combineLatest(steps$);
			}),
			map((steps) =>
				steps
					.filter((step): step is Step => !!step)
					.filter((step) => step.state !== 'archived' && step.state !== 'deleted')
			)
		);

		combineLatest([favoritesSteps$, this._favoriteStepsFilter$$])
			.pipe(
				untilDestroyed(this),
				tap(([steps, filters]) => {
					this.favoriteSteps = steps.filter((step) => filters.includes(step.kind));
				})
			)
			.subscribe();

		// get all pages not archived or deleted
		combineLatest([this._pagesRepository.pages$, this.form$$$.id$])
			.pipe(
				untilDestroyed(this),
				tap(([pages, formId]) => {
					// list pages matching pageData.formData.formId === formId
					const availablePages: Page[] = [...pages.filter((page) => page.state === 'default')];
					const defaultPageData: PageData = {};
					const pagesMatchingForm: Page[] = availablePages.filter((availablePage) => {
						const pageData: PageData = availablePage.data ? JSON.parse(availablePage.data) : defaultPageData;
						return formId && pageData.formData?.formId === formId;
					});
					this.pages = sortBy(pagesMatchingForm, ['timeCreation', 'timeUpdate']).reverse();
					// select most recent one (if at least one)
					if (this.pages.length > 0) this.selectedPage = this.pages[0];
				})
			)
			.subscribe();
	}

	ngAfterViewInit(): void {
		if (this.stepIdFocused) this.scrollToStep(this.stepIdFocused);
	}

	// interceptTabChange(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
	// 	if (!isEqual(this.customisationData, this.originalCustomisationData)) {
	// 		this._notificationsService
	// 			.confirm(
	// 				'Unsaved modifications',
	// 				"Your last edits won't be saved, are you sure to leave?",
	// 				'Resume editing',
	// 				'Leave and clear changes'
	// 			)
	// 			.pipe(
	// 				untilDestroyed(this),
	// 				tap((confirm) => {
	// 					if (confirm) {
	// 						this.customisationData = this.originalCustomisationData;
	// 						return MatTabGroup.prototype._handleClick.apply(this.matTabGroupActions, [tab, tabHeader, idx]);
	// 					}
	// 				})
	// 			)
	// 			.subscribe();
	// 	} else {
	// 		return MatTabGroup.prototype._handleClick.apply(this.matTabGroupActions, [tab, tabHeader, idx]);
	// 	}
	// }

	// prevent to close when form is not synced

	@HostListener('window:beforeunload', ['$event'])
	preventWindowClosing(event: BeforeUnloadEvent) {
		if (this.form$$$.value?.toSync !== false) event.returnValue = 'Your interview is not yet synced!';
	}

	// MENU
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	changeSelectedAction($event?: any) {
		// if leaving create mode, save the previous menu and clear it
		this.updateMenuDisplay($event.value);
		this.selectedAction = $event.value;
		this.updateDadParams();
	}

	// MENU
	updateMenuDisplay(value: PageAction) {
		if (value !== 'create') {
			setTimeout(() => {
				this._check();
			}, 100);
		}
		// if going back to create mode, restore the previous menu
		if (this.selectedAction !== 'create' && value === 'create') {
			if (this.stepIdFocused) {
				this.scrollToStep(this.stepIdFocused);
			}
		}
	}

	// BRANDS
	createBrand() {
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

	updateFormBrand(brandId?: string | null) {
		if (!this.canYouEdit) return;

		const form = this.form$$$.value;
		if (!form) return;
		this._formsManagementService.update(form.id, {
			brandId: brandId ?? null,
		});
	}

	// COPY PASTE LINKS
	updateFormUrl(formId: string) {
		this.formUrl = window.location.origin + '/forms/open/' + formId;
	}
	updateEmbeddingCode(formId: string) {
		this.embeddingCode = `<iframe src="${window.location.origin}/forms/open/${formId}?embedded=1" width="500px" height="800px" frameborder="0" allowfullscreen allowtransparency style="background: #FFFFFF;" allow="camera;microphone" ></iframe>`;
	}
	processCopyToClipboardEvent(copied: boolean, message = 'Copied to clipboard!') {
		if (copied) {
			this._notificationsService.success(message, undefined, undefined, undefined, 1000);
		} else {
			this._notificationsService.error('Error while copying');
		}
	}

	// Opens a pompt to edit a form
	openFormPromptEditor(formId: string) {
		if (!this.canYouEdit) return;

		this._formsManagementService
			.get$(formId)
			.pipe(
				take(1),
				switchMap((form) => {
					if (!form) return of(undefined);
					return this._formsManagementService.openPromptEditor({
						modalTitle: 'Update your interview',
						modalSubmitText: 'Save',
						formId: formId,
						form: form,
					});
				}),
				untilDestroyed(this),
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}

	setStepFocusedFromEditableStep(stepId: string) {
		this._formsRepository.setFormProps({ stepIdFocused: stepId });
	}

	generatePdf() {
		// this.filesRepository.generatePdf('', this.form$$$.value?.title || '', this.formUrl, 'Interview');
		const data: ExportDataToPDFPrompt = {
			customisationData: this.customisationData,
			form: this.form$$$.value,
			formUrl: this.formUrl,
		};
		this._dialog.open(ExportPdfPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: data,
		});
	}

	updateDadParams() {
		this.updateQueryParam({
			action: this.selectedAction,
			stepId: this.stepIdFocused,
		});
	}
	updateQueryParam(queryParams: Params) {
		const url = this._router
			.createUrlTree([], {
				// relativeTo: this.activatedRoute,
				queryParams,
				queryParamsHandling: 'merge',
			})
			.toString();
		this._location.go(url);
	}

	// change the form
	selectForm(formId: string) {
		this._router.navigate(['/dashboard', 'forms', 'editor', formId], {
			queryParams: {
				action: this.selectedAction,
			},
		});
	}

	openMultiQuestionModal(targetIndex?: number) {
		const dr = this._dialog.open(MultiQuestionsPromptComponent, {
			height: '90%',
			width: '90%',
			data: {
				hasWelcomeStep: alreadyHasStep(this.basketSteps, 'welcome-step'),
				hasTerminationStep: alreadyHasStep(this.basketSteps, 'termination'),
			},
		});
		let indexToUse = targetIndex ?? this.basketSteps.length;
		let scrollToIndex: string | undefined = undefined;
		dr.afterClosed().subscribe((multiImportSteps?: StepToAppend[]) => {
			if (!multiImportSteps) return;
			const form = this.form$$$.value;
			if (!form) return;

			multiImportSteps.forEach((stepFromMultiStep, keyIndex) => {
				const newStepId = uuidv4();

				scrollToIndex = scrollToIndex ?? newStepId;

				indexToUse = indexToUse + keyIndex;

				const newStep: Step = generateStepFromDetails(
					stepFromMultiStep.stepInstance.stepDetail,
					{ [stepFromMultiStep.attribute.name]: stepFromMultiStep.inputText },
					form.id,
					indexToUse,
					newStepId
				);

				this._basketSteps.splice(indexToUse, 0, newStep);
				this.updateSteps(true);
			});
			if (scrollToIndex) this.scrollToStep(scrollToIndex);

			this._check();
		});
	}

	// BASKET (formSteps)
	appendItem(stepDetail: StepDetail, targetIndex?: number) {
		this._amplitudeService.saveEvent('form-editor:new-step', {
			stepName: stepDetail.name,
		});

		if (!this.canYouEdit) return;
		if (!this.form$$$.id) return;
		if (stepDetail.name === 'welcome-step' && alreadyHasStep(this.basketSteps, 'welcome-step')) {
			this._notificationsService.info('Only one welcome message allowed.', 'Welcome message');
			return;
		}
		if (stepDetail.name === 'termination' && alreadyHasStep(this.basketSteps, 'termination')) {
			this._notificationsService.info('Only one closing message allowed.', 'Closing message');
			return;
		}

		const indexToUse = targetIndex ?? this.basketSteps.length;

		const newStep: Step = generateStepFromDetails(
			stepDetail,
			{},
			this.form$$$.id,
			indexToUse,
			uuidv4()
			// false // not collapsed at creation
		);

		this._basketSteps.splice(indexToUse, 0, newStep);
		this.updateSteps();
		// this.notificationsService.success('Step added at the end!');
		this.scrollToStep(newStep.id);
	}

	/**
	 * Insert a new step based on a favorite step (copy attrs and duplicate playlist)
	 *
	 * @param favoriteStepId id from source step to insert
	 * @param index if not provided, index will be the basketSteps length value
	 * @returns
	 */
	appendFavoriteStep(favoriteStepId: string, index?: number) {
		const favoriteStep = this.favoriteSteps.find((favoriteStep) => favoriteStep.id === favoriteStepId);
		if (!favoriteStep) return;

		const to = index ?? this.basketSteps.length + 0.5;

		if (!this.form$$$.id) return;
		if (favoriteStep.kind === 'welcome-step' && alreadyHasStep(this.basketSteps, 'welcome-step')) {
			this._notificationsService.info('Only one welcome message allowed.', 'Welcome message');
			return;
		}
		if (favoriteStep.kind === 'termination' && alreadyHasStep(this.basketSteps, 'termination')) {
			this._notificationsService.info('Only one closing message allowed.', 'Closing message');
			return;
		}

		const stepCopy = this._stepsManagementService.duplicateStep(favoriteStep, this.form$$$.id, favoriteStep.rank);
		this._basketSteps.splice(to, 0, stepCopy);
		this.updateSteps();
		this.scrollToStep(stepCopy.id);
		return;
	}

	moveItem(index: number, direction: 'up' | 'down') {
		this._amplitudeService.saveEvent('form-editor:move-step', {
			index,
			direction,
		});
		if (!this.canYouEdit) return;

		const item = this.basketSteps[index];
		if (direction === 'up') {
			if (index === 0) return;
			this._basketSteps[index] = this._basketSteps[index - 1];
			this._basketSteps[index - 1] = item;
		} else {
			if (index === this.basketSteps.length - 1) return;
			this._basketSteps[index] = this._basketSteps[index + 1];
			this._basketSteps[index + 1] = item;
		}
		this.updateSteps();
		this.scrollToStep(item.id);
	}

	duplicate(index: number) {
		this._amplitudeService.saveEvent('form-editor:duplicate-step', {
			index,
		});
		if (!this.canYouEdit) return;

		const originalElement: Step = this.basketSteps[index];

		if (originalElement.kind === 'welcome-step') {
			this._notificationsService.info('Only one welcome message allowed.', 'Welcome message');
			return;
		}
		if (originalElement.kind === 'termination') {
			this._notificationsService.info('Only one closing message allowed.', 'Closing message');
			return;
		}

		const copiedElement = this._stepsManagementService.duplicateStep(originalElement, undefined, index + 0.5);

		// insert copied element after original element
		this.basketSteps.splice(index + 1, 0, copiedElement);
		this.updateSteps();

		this.scrollToStep(copiedElement.id);
	}

	drop(event: CdkDragDrop<Step[]> | CdkDragDrop<StepInstance[]>) {
		if (!this.canYouEdit) return;

		const item_target_id = event.container.id;

		const sourceStepIndex = event.item.element.nativeElement.attributes.getNamedItem('sourceStepIndex')?.value;

		const previousIndexToUse = sourceStepIndex ? Number(sourceStepIndex) : event.previousIndex;

		const BASKET_CONTAINER_ID = 'formStepsList';

		if (!event.isPointerOverContainer) {
			// Dropped outside of container
			return;
		}

		if (event.previousContainer === event.container) {
			this._amplitudeService.saveEvent('form-editor:move-step');
			console.log('Move item in array 1', event.container.data, previousIndexToUse, event.currentIndex);
			moveItemInArray<Step | StepInstance>(event.container.data, previousIndexToUse, event.currentIndex);
			console.log('Move item in array 2', event.container.data, previousIndexToUse, event.currentIndex);

			this.updateSteps();
			this.scrollToStep(item_target_id);
		} else {
			if (item_target_id === BASKET_CONTAINER_ID) {
				this._amplitudeService.saveEvent('form-editor:new-step');

				const to = clamp(event.currentIndex, event.container.data.length);
				if (!this.form$$$.id) return;

				// get the id to check if it's a step from the favorites steps
				const id = event.previousContainer.data[previousIndexToUse].id;
				const isStepFromFavorite = this.favoriteSteps.filter((favoriteStep) => favoriteStep.id === id).length > 0;

				if (isStepFromFavorite) {
					this.appendFavoriteStep(id, to);
					return;
				}

				const stepInstance = event.previousContainer.data[previousIndexToUse] as StepInstance;

				const newStep = generateStepFromDetails(
					stepInstance.stepDetail,
					{},
					this.form$$$.id,
					to - 0.5,
					uuidv4()
					// false // not collapsed at creation
				);
				event.container.data.splice(to, 0, newStep);
				this.updateSteps();
				this.scrollToStep(newStep.id);
			}
		}

		this._check();
	}
	noReturnPredicate() {
		/** Predicate function that doesn't allow items to be dropped into a list. */
		return false;
	}

	getFavoriteStepDetails(step: Step) {
		const UNKNOWN_STEP_INSTANCE_NAME = 'unknown-step';
		let stepInstance = ALL_STEP_INSTANCES.find((stepInstance: StepInstance) => stepInstance.stepDetail.name === step.kind);
		if (!stepInstance) {
			stepInstance = ALL_STEP_INSTANCES.find(
				(stepInstance: StepInstance) => stepInstance.stepDetail.name === UNKNOWN_STEP_INSTANCE_NAME
			);
		}

		if (!stepInstance) {
			throw new Error('Step not found');
		}

		const stepAttrs = JSON.parse(step.attrs || '{}');
		const stepTitle =
			stepAttrs.steptitle ??
			stepAttrs.stepTitle ??
			stepAttrs.stepQuestion ??
			stepAttrs.displayTitle ??
			stepAttrs.stepQuestion ??
			stepInstance.stepDetail.menuText;

		const form = this._formsManagementService.get(step.formId);

		const stepDetail: StepDetail = {
			...stepInstance.stepDetail,
			menuText: stepTitle,
			menuHint: form?.title ? 'This step comes from "' + form?.title + '".' : '',
		};

		return stepDetail;
	}

	updateRanks() {
		const needRankUpdate = this.basketSteps.some((step, index) => step.rank !== index);
		// console.log('updateRanks?', needRankUpdate);

		if (!needRankUpdate) return;

		this._basketSteps.forEach((step, rank) => {
			step.rank = rank;
		});
	}

	updateSteps(noWarning = false) {
		if (!this.canYouEdit) return;
		// console.log('updateSteps');

		this.processWelcomeMessage(noWarning);
		this.processTerminationMessage(noWarning);

		const form = this.form$$$.value;
		if (!form) return;
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;

		if (!ownerId) {
			console.error('No user id');
			return;
		}
		this.updateRanks();

		applyTransaction;
		{
			this._stepsManagementService.upsertMany(this._basketSteps);
			const stepIdsToKeep = this._basketSteps.map((step) => step.id);

			// archive steps not present anymore
			this._stepsManagementService.getFormSteps(form.id).map((step) => {
				if (!stepIdsToKeep.includes(step.id)) {
					this._stepsManagementService.update(step.id, {
						state: 'archived',
					});
				} else {
					if (step.state == 'archived') {
						console.log('Unarchiving step', step.id);
						this._stepsManagementService.update(step.id, {
							state: 'default',
						});
					}
				}
			});
		}

		this._check();
	}

	toggleCollapseAll(collapse?: boolean) {
		const shouldCollapse = collapse ?? !this.collapseAll;
		this.collapseAll = shouldCollapse;

		this._amplitudeService.saveEvent('form-editor:collapse-change', {
			shouldCollapse,
		});

		// this.basketSteps.forEach((step) => {
		//   step.collapsed = collapse;
		// });
		// this.numberNotCollapsed = collapse ? 0 : this.basketSteps.length;
		// this.numberCollapsed = this.basketSteps.length - this.numberNotCollapsed;
		// this.check();
	}

	processProviderSelection(providers: Provider[]) {
		this._amplitudeService.saveEvent('form-editor:change-providers', {
			providers,
		});
		const newProviders: Provider[] = providers;
		this.selectedProviders = sortBy(newProviders, 'priority');
		this._check();
	}

	processWelcomeMessage(noWarning = false) {
		// list all welcome step
		const firstWelcomeStepIndex = this.basketSteps.findIndex((step) => step.kind === 'welcome-step');

		if (firstWelcomeStepIndex === -1) {
			return;
		}

		const welcomeSteps = this.basketSteps.filter((step) => step.kind === 'welcome-step');

		// if there is more than 1 welcome formStep, only keep the first one
		if (welcomeSteps.length > 1) {
			if (!noWarning) this._notificationsService.info('Only one welcome message allowed.', 'Welcome message');
			this.basketSteps = this.basketSteps.filter(
				(step, stepIndex) => step.kind !== 'welcome-step' || stepIndex === firstWelcomeStepIndex
			);
			this.scrollToStep(this.basketSteps[firstWelcomeStepIndex].id);
		}

		// if welcome step is not the first, move it to the first
		if (firstWelcomeStepIndex !== 0) {
			const firstWelcomeStep = this.basketSteps[firstWelcomeStepIndex];
			this.basketSteps.splice(firstWelcomeStepIndex, 1);
			this.basketSteps.unshift(firstWelcomeStep);
			// this.notificationsService.info('Welcome message has to be the first step.', 'Welcome message');
			if (!noWarning)
				this._notificationsService
					.confirm('', 'Welcome message has to be the first step.', '', 'I understand')
					.subscribe(() => {
						//
						this.scrollToStep(firstWelcomeStep.id);
					});
		}
	}

	processTerminationMessage(noWarning = false) {
		// list all termination step
		const firstTerminationStepIndex = this.basketSteps.findIndex((step) => step.kind === 'termination');

		if (firstTerminationStepIndex === -1) {
			return;
		}

		const terminationSteps = this.basketSteps.filter((step) => step.kind === 'termination');

		// if there is more than 1 termination formStep, only keep the first one
		if (terminationSteps.length > 1) {
			if (!noWarning) this._notificationsService.info('Only one closing message allowed.', 'Closing message');
			this.basketSteps = this.basketSteps.filter(
				(step, stepIndex) => step.kind !== 'termination' || stepIndex === firstTerminationStepIndex
			);
			this.scrollToStep(this.basketSteps[firstTerminationStepIndex].id);
		}

		// if termination step is not the last, move it to the last
		if (firstTerminationStepIndex !== this.basketSteps.length - 1) {
			const firstTerminationStep = this.basketSteps[firstTerminationStepIndex];
			this.basketSteps.splice(firstTerminationStepIndex, 1);
			this.basketSteps.push(firstTerminationStep);
			if (!noWarning) this._notificationsService.info('Closing message has to be the last step.', 'Closing message');
		}
	}

	tabChanged(tabChangeEvent: MatTabChangeEvent): void {
		const action = PageActionIndex[tabChangeEvent.index];
		this.updateMenuDisplay(action);
		this.selectedAction = action;
		this.updateDadParams();
	}

	navigateTo(tab: string) {
		const action = tab as PageAction;
		this.updateMenuDisplay(action);
		this.selectedAction = action;
		this.updateDadParams();
	}

	scrollToStep(stepId: string, behavior: ScrollBehavior = 'smooth') {
		setTimeout(() => {
			const step = this._el.nativeElement.querySelector(`#step-${stepId}`);
			step?.scrollIntoView(behavior ? { behavior } : undefined);
		}, 100);
	}

	processCustomisationDataChange(newData: FormCustomisationDetails) {
		// console.log('processCustomisationDataChange', newData, this.customisationData, this.originalCustomisationData);

		this.customisationData = cloneDeep(newData);
	}

	saveCustomisationData(dataToSave: FormCustomisationDetails) {
		// console.log('saveCustomisationData', dataToSave, this.customisationData, this.originalCustomisationData);
		this.customisationData = cloneDeep(dataToSave);
		// this.originalCustomisationData = cloneDeep(dataToSave);
		const formId = this.form$$$.id;
		if (!formId) return;

		const data = JSON.parse(this.form$$$.value?.data || '{}') as FormData;
		data.customisationDetails = dataToSave;

		const newData = JSON.stringify(data);
		const updatedForm: Partial<Form> = {
			data: newData,
			brandId: dataToSave.brandId,
		};
		this._formsManagementService.update(formId, updatedForm);
	}

	public hasDifference() {
		return !isEqual(this.customisationData, this.originalCustomisationData);
	}

	ngOnDestroy() {
		this._layoutRepository.centralTemplate = undefined;
	}

	/**
	 * Object promt from pages repository
	 * fills title / description / slug / domain with partial page
	 */
	openPageObjectPrompt() {
		const form = this.form$$$.value;
		if (!form) return;
		const defaultFormData: FormData = {};
		// parse data from form
		const parsedData: FormData = form?.data ? JSON.parse(form.data) : defaultFormData;
		// get brandId
		const brandId = parsedData?.customisationDetails?.brandId;
		// get brand logo
		const brandLogo = brandId ? this._brandsRepository.get(brandId)?.logo : undefined;
		// create page Data
		const pageData: PageData = { faviconUrl: brandLogo };
		// fill partial page
		const page: Partial<Page> = {
			data: JSON.stringify(pageData),
		};

		this._pagesRepository
			.openObjectPrompt({
				modalTitle: 'Create a new page',
				modalSubmitText: 'Create',
				target: this.form$$$.id,
				page: page,
			})
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result && result.id) {
						this._selectedPage = result;
						this._check();
					}
				})
			)
			.subscribe();
	}

	/**
	 * given domainId returns the target url
	 * @param domainId
	 * @returns url: string
	 */
	getDomainUrlById(domainId: string | undefined): string | undefined {
		if (!domainId) return undefined;
		return this._domainRepository.get(domainId)?.url;
	}
}
