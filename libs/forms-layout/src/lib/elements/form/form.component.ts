import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import {
	FormsManagementService,
	getPreviewTextFromStep,
	getStepIconFromStepKind,
	RecordingSessionsManagementService,
	StepsManagementService,
} from '@rumble-pwa/forms-system';
import { FormsRepository } from '@rumble-pwa/forms/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import {
	convertFontLabelToFontValue,
	DEFAULT_CUSTOMISATION_DETAILS,
	Form,
	FormCustomisationDetails,
	FormData,
	LAYOUTS,
	RecordingSession,
	Step,
} from '@rumble-pwa/mega-store';
import { PlaylistPlayerComponent } from '@rumble-pwa/player/specialised';
import { DEFAULT_RECORDING_PROPS, RecordingProps, RecordingRepository } from '@rumble-pwa/record/state';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Bs$$, DataObsViaId, updateInPlace } from '@rumble-pwa/utils';
import { combineLatest, of } from 'rxjs';
import { filter, startWith, switchMap, take, tap } from 'rxjs/operators';
import { FormStepperComponent } from '../form-stepper/form-stepper.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form',
	templateUrl: './form.component.html',
	styleUrls: ['./form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged, OnInit {
	profile$$ = new Bs$$<User>();
	public get profile() {
		return this.profile$$.value;
	}
	@Input()
	public set profile(newProfile) {
		this.profile$$.value = newProfile;
	}

	@Input() stepId?: string;

	public abs = Math.abs;

	_steps: Step[] = [];
	public set steps(v: Step[]) {
		updateInPlace(this._steps, v, ['operation']);
		this._check();
	}
	public get steps(): Step[] {
		return this._steps;
	}

	form$$$ = new DataObsViaId<Form>((formId: string) => this.formsManagementService.get$(formId));
	@Input()
	public set formId(v: string | undefined) {
		if (v == this.formId) return;
		this.form$$$.id = v;
	}
	public get formId(): string | undefined {
		return this.form$$$.id;
	}

	@Input()
	providerId = 'default-participant';

	@Input() previewMode = false;

	recordingSession$$$ = new DataObsViaId<RecordingSession>(
		(recordingSessionId: string) =>
			this.recordingSessionsManagementService.get$(recordingSessionId).pipe(tap((r) => console.log({ r }))),
		undefined
		// 'recordingSession'
	);

	@ViewChild('stepper') stepper?: FormStepperComponent;
	@ViewChild('player') player?: PlaylistPlayerComponent;

	// layout
	private _layoutSize = 2;
	public get layoutSize() {
		return this._layoutSize;
	}
	public set layoutSize(value) {
		this._layoutSize = value;
		this.displayDecoration = this.shouldDisplayDecoration(this.formCustomisation);
		this._check();
	}

	private _forceMobile = false;
	public get forceMobile() {
		return this._forceMobile;
	}
	@Input()
	public set forceMobile(value) {
		this._forceMobile = value;
		this.displayDecoration = this.shouldDisplayDecoration(this.formCustomisation);
		this._check();
	}

	indexPercentage = 5;

	private _selectedIndex = 0;
	public get selectedIndex() {
		return this._selectedIndex;
	}
	public set selectedIndex(newSelectedIndex) {
		this._selectedIndex = newSelectedIndex;
		this.indexPercentage = ((newSelectedIndex + 1) / this.steps.length) * 100;
		this._formsRepository.setFormProps({ stepIdFocused: this.steps[newSelectedIndex].id });
		this._check();
	}

	ratio = 0.5;
	fill = true;
	orientation: 'row' | 'column' = 'row';
	direction: 'normal' | 'reverse' = 'normal';
	objectFit = 'scale-down';
	width = 50;
	height = 100;
	displayDecoration = true;

	image$$$ = new DataObsViaId<string>((imageId: string) => this.filesRepository.convertRSurlToUrl$(imageId));

	_formCustomisation: FormCustomisationDetails = DEFAULT_CUSTOMISATION_DETAILS;
	@Input()
	public set formCustomisation(newFormCustomisation) {
		this._formCustomisation = { ...DEFAULT_CUSTOMISATION_DETAILS, ...newFormCustomisation };

		this.displayDecoration = true;
		this.ratio = newFormCustomisation.imageSizeRatio ?? 0.5;
		this.fill = true;
		this.orientation = 'row';
		this.direction = 'normal';
		this.objectFit = 'cover';
		this.width = 2 * this.ratio * 50;
		this.height = 100;
		this.image$$$.id = newFormCustomisation.imageSrc;

		if (newFormCustomisation.layout?.toLowerCase().includes('centered')) {
			this.fill = false;
			this.objectFit = 'scale-down';
		}
		if (
			newFormCustomisation.layout?.toLowerCase().includes('right') ||
			newFormCustomisation.layout?.toLowerCase().includes('bottom')
		) {
			this.direction = 'reverse';
		}

		if (
			newFormCustomisation.layout?.toLowerCase().includes('top') ||
			newFormCustomisation.layout?.toLowerCase().includes('bottom')
		) {
			this.orientation = 'column';
			this.width = 100;
			this.height = 2 * this.ratio * 50;
		}

		this.displayDecoration = this.shouldDisplayDecoration(newFormCustomisation);

		this._check();
	}
	public get formCustomisation() {
		return this._formCustomisation;
	}

	getFontStyle = convertFontLabelToFontValue;

	LAYOUT_TEMPLATES = LAYOUTS;

	private _guestFormsValidity: boolean[] = [];
	public get guestFormsValidity(): boolean[] {
		return this._guestFormsValidity;
	}
	public set guestFormsValidity(value: boolean[]) {
		this._guestFormsValidity = value;
	}

	// isRecording = false;
	toggleRecording = false;
	isOwner = false;

	getPreviewTextFromStep = getPreviewTextFromStep;
	getStepIconFromStepKind = getStepIconFromStepKind;

	// current state of the recording repository
	recordingProps: RecordingProps = DEFAULT_RECORDING_PROPS;

	@Input()
	removeWelcomeStep = false;
	@Input()
	removeTerminationStep = false;

	@Output() endReached = new EventEmitter<void>();

	constructor(
		private recordingSessionsManagementService: RecordingSessionsManagementService,
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private formsManagementService: FormsManagementService,
		private stepsManagementService: StepsManagementService,
		private notificationsService: NotificationsService,
		private filesRepository: FilesRepository,
		private usersRepository: UsersRepository,
		private router: Router,
		private _recordingRepository: RecordingRepository,
		private _formsRepository: FormsRepository,
		private _usersRepository: UsersRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// subscribe to the recording props from recording repository
		this._recordingRepository.recordingProps$
			.pipe(
				untilDestroyed(this),
				tap((props) => {
					this.recordingProps = props;
					this._check();
				})
			)
			.subscribe();

		this.layoutSize$
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this.displayDecoration = this.shouldDisplayDecoration(this.formCustomisation);
					this._check();
				})
			)
			.subscribe();

		// get the recording session for the connected user
		// update steps available based on recordingSession
		combineLatest([this.profile$$.$$, this.recordingSessionsManagementService.recordingSessionsLoaded$$, this.form$$$.$])
			.pipe(
				untilDestroyed(this),
				filter(([profile, recordingSessionsLoaded, form]) => !!profile?.id && recordingSessionsLoaded && !!form?.id),
				switchMap(([profile, , form]) => {
					this.isOwner = form?.ownerId === profile?.id;
					if (form && form.id) {
						return this.recordingSessionsManagementService.getPersonalFormRecordingSessions$(form.id, profile?.id);
					}
					return of([]);
				}),
				tap((recordingSessions) => {
					if (recordingSessions.length > 0) {
						this.recordingSession$$$.id = recordingSessions[0].id;
					} else {
						if (this.formId && this.profile$$.value?.id)
							this.recordingSessionsManagementService.createRecordingSession(
								this.formId,
								this.profile$$.value?.id
							);
					}
				})
			)
			.subscribe();

		this.profile$$.$.pipe(untilDestroyed(this)).subscribe();

		// load customisation data
		this.form$$$.$.pipe(
			untilDestroyed(this),
			filter((form) => !!form),
			tap((form) => {
				if (form) {
					const data: FormData = JSON.parse(form.data ?? '{}');
					this.formCustomisation = data.customisationDetails ?? {};
				}
			})
		).subscribe();

		// load form image for customisation
		this.image$$$.$.pipe(
			untilDestroyed(this),
			tap((imageUrl) => {
				this._check();
			})
		).subscribe();

		// check recording session is synced
		this.recordingSession$$$.$.pipe(
			untilDestroyed(this),
			switchMap((recordingSession) => {
				if (recordingSession && recordingSession.id) {
					// console.log('checking recording session sync state', recordingSession.id);
					return this.recordingSessionsManagementService.isRecordingSessionSynced$(recordingSession.id);
				} else {
					return of(false);
				}
			})
		).subscribe();
	}

	ngOnInit() {
		/**
		 * loads steps based on recording session
		 * In NgOnInit, because we need to wait for Input() to be set before we can generateStepsToDisplay
		 */
		combineLatest([
			this.form$$$.id$.pipe(
				switchMap((formId) => (formId ? this.stepsManagementService.getFormSteps$(formId) : of([]))),
				startWith([])
			),
			this.recordingSession$$$.$.pipe(startWith(undefined)),
		])
			.pipe(
				untilDestroyed(this),
				filter(([steps]) => steps.length > 0),
				tap(([steps, recordingSession]) => {
					// console.log({ steps, recordingSession });
					if (recordingSession) {
						this.steps = this.generateStepsToDisplay(steps, false);
					} else {
						this.steps = this.generateStepsToDisplay(steps, true);
					}
				})
			)
			.subscribe();
	}

	shouldDisplayDecoration(formCustomisation: FormCustomisationDetails) {
		return !(this.isMobile || this.forceMobile || formCustomisation?.layout === 'NO_IMAGE' || !formCustomisation?.imageSrc);
	}

	generateStepsToDisplay(v: Step[], firstOnly = false) {
		if (!this.formId) return [];

		let updatedListOfSteps = [...v];

		const newTerminationStep: Step = {
			id: 'AUTO-termination-' + this.formId,
			rank: v.length,
			formId: this.formId,
			kind: 'termination',
			attrs: '{}',
			source: 'auto',
		};

		const newWelcomeStep: Step = {
			id: 'AUTO-welcome-' + this.formId,
			rank: -1,
			formId: this.formId,
			kind: 'welcome-step',
			attrs: '{}',
			source: 'auto',
		};

		// get welcome-step index
		const welcomeStepIndex = updatedListOfSteps.findIndex((step) => step.kind == 'welcome-step');
		// get termination-step index
		const terminationStepIndex = updatedListOfSteps.findIndex((step) => step.kind == 'termination');
		updatedListOfSteps = [
			// move welcome-step to the beginning or add one if not found
			...(this.removeWelcomeStep ? [] : [welcomeStepIndex >= 0 ? updatedListOfSteps[welcomeStepIndex] : newWelcomeStep]),
			// remove ALL welcome-step from the list (handle case with multiple welcome step)
			...updatedListOfSteps.filter((step) => step.kind != 'welcome-step' && step.kind != 'termination'),
			// add termination step
			...(this.removeTerminationStep
				? []
				: [terminationStepIndex >= 0 ? updatedListOfSteps[terminationStepIndex] : newTerminationStep]),
		];

		if (firstOnly && !this.removeWelcomeStep) {
			return updatedListOfSteps.slice(0, 1);
		}
		return updatedListOfSteps;
	}

	sendInvitationEmail(email: string) {
		if (this.formId && email)
			this.formsManagementService
				.requestShareFormInvitation$(this.formId, email)
				.pipe(take(1))
				.subscribe(({ success, error_message }) => {
					if (success) {
						this.notificationsService.success(`Invitation sent to ${email}`);
					}
					if (error_message) {
						this.notificationsService.error(error_message || 'Error while sending invitation to' + email);
					}
				});
		else {
			console.log('no formId or email', this.formId, email);
		}
	}

	goNext() {
		this.stepper?.next();
	}

	goPrev() {
		this.stepper?.previous();
	}

	goToStepIndex(index: number) {
		this.stepper?.nextUntilIndex(index);
	}

	processForward(order: string) {
		if (order.startsWith('share:') && !this.previewMode) {
			const email = order.split(':')[1];
			if (email && email.length > 0) {
				this.sendInvitationEmail(email);
			}
		} else if (order === 'next') {
			this.goNext();
		} else if (order === 'prev') {
			this.goPrev();
		}
	}

	openFormEditor() {
		this.notificationsService
			.confirm('Are you sure you want to leave this page and open the form editor?')
			.subscribe((confirm) => {
				if (confirm) {
					this.router.navigate(['/forms/editor', this.formId]);
				}
			});
	}

	public processEndReachedEvent() {
		this.endReached.emit();
	}

	@HostListener('document:keydown', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		if (event.key === 'Tab') event.preventDefault();
	}
}
