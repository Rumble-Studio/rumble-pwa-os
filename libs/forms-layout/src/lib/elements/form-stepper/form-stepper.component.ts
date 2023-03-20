import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { Directionality } from '@angular/cdk/bidi';
import { CdkStepper, StepContentPositionState } from '@angular/cdk/stepper';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BrokerService, BROKE_OPTIONS } from '@rumble-pwa/broker-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { AnswersManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { DEFAULT_FORM_PROPS, FormProps, FormsRepository } from '@rumble-pwa/forms/state';
import { FormCustomisationDetails, RecordingSession, Step } from '@rumble-pwa/mega-store';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { VirtualPlayerService } from '@rumble-pwa/player/services';
import { RecorderService } from '@rumble-pwa/record/services';
import { DEFAULT_RECORDING_PROPS, RecordingProps, RecordingRepository } from '@rumble-pwa/record/state';
import { TracksRepository } from '@rumble-pwa/tracks/state';
import { UserData } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Attr, DataObsViaId } from '@rumble-pwa/utils';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, tap, throttleTime } from 'rxjs/operators';
import { FormOpenerPromptComponent } from '../form-opener-prompt/form-opener-prompt.component';
import { translate as t } from '@ngneat/transloco';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-stepper',
	templateUrl: './form-stepper.component.html',
	styleUrls: ['./form-stepper.component.scss'],
	providers: [{ provide: CdkStepper, useExisting: FormStepperComponent }],
	// host: {
	//   role: 'tablist',
	// },
	animations: [
		trigger('stepTransition', [
			state('previous', style({ transform: 'translate3d( 0,-100%, 0)', opacity: 1 })),
			state('current', style({ transform: 'translate3d(0, 0, 0)', opacity: 1 })),
			state('next', style({ transform: 'translate3d( 0,100%, 0)', opacity: 1 })),
			transition(':enter', animate(0)),
			transition('* => *', animate('500ms cubic-bezier(0.35, 0, 0.25, 1)')),
		]),
	],
	// animations: [horizontalStepTransition],
})
export class FormStepperComponent extends CdkStepper {
	@Input() formCustomisationDetails?: FormCustomisationDetails;
	@Input() formSteps: Step[] = [];

	@Input()
	previewMode = false;

	/** Event emitted when the current step is done transitioning in. */
	@Output() readonly animationDone: EventEmitter<void> = new EventEmitter<void>();

	/** Stream of animation `done` events when the body expands/collapses. */
	readonly _animationDone = new Subject<AnimationEvent>();

	@Output() selectedIndexChange = new EventEmitter<number>();
	@Output() endReached = new EventEmitter<void>();

	@Input()
	guestFormsValidity: boolean[] = [];

	recordingSession$$$ = new DataObsViaId<RecordingSession>((recordingSessionId: string) =>
		this.recordingSessionsManagementService.get$(recordingSessionId)
	);
	public get recordingSessionId(): string | undefined {
		return this.recordingSession$$$.id;
	}
	@Input()
	public set recordingSessionId(v: string | undefined) {
		if (v == this.recordingSession$$$.id) return;
		this.recordingSession$$$.id = v;
	}

	// current state of the recording repository
	recordingProps: RecordingProps = DEFAULT_RECORDING_PROPS;

	formProps: FormProps = DEFAULT_FORM_PROPS;

	processScroll$$ = new Subject<any>();

	constructor(
		dir: Directionality,
		cdr: ChangeDetectorRef,
		public elementRef: ElementRef<HTMLElement>,
		private brokerService: BrokerService,
		private notificationsService: NotificationsService,
		private recorderService: RecorderService,
		private amplitudeService: AmplitudeService,
		private recordingSessionsManagementService: RecordingSessionsManagementService,
		private answersManagementService: AnswersManagementService,
		private _TracksRepository: TracksRepository,
		private usersRepository: UsersRepository,
		private _recordingRepository: RecordingRepository,
		private _formsRepository: FormsRepository,
		private _dialog: MatDialog,
		private _virtualPlayerService: VirtualPlayerService
	) {
		super(dir, cdr, elementRef);

		let edgeReached = false;
		this.processScroll$$
			.pipe(
				untilDestroyed(this),
				tap((v) => {
					if (Math.abs(v.deltaY) < 5) {
						// we only update the state if the user is not scrolling
						edgeReached = v.bottomReached || v.topReached;
					}
				}),
				throttleTime(1800),
				filter(() => edgeReached),

				filter((value) => (value.bottomReached && value.deltaY > 0) || (value.topReached && value.deltaY < 0)),
				tap((value) => {
					if (value.bottomReached && value.deltaY > 0) {
						this.next();
					} else if (value.topReached && value.deltaY < 0) {
						this.previous();
					}
				})
			)
			.subscribe();

		// subscribe to the recording props from recording-repository
		this._recordingRepository.recordingProps$
			.pipe(
				untilDestroyed(this),
				tap((props) => {
					this.recordingProps = props;
				})
			)
			.subscribe();

		// subscribe to the form props from forms-repository
		this._formsRepository.formProps$
			.pipe(
				untilDestroyed(this),
				tap((formProps) => {
					this.formProps = formProps;
				})
			)
			.subscribe();

		this._animationDone
			.pipe(
				untilDestroyed(this),
				// This needs a `distinctUntilChanged` in order to avoid emitting the same event twice due
				// to a bug in animations where the `.done` callback gets invoked twice on some browsers.
				// See https://github.com/angular/angular/issues/24084
				distinctUntilChanged((x, y) => x.fromState === y.fromState && x.toState === y.toState)
			)
			.subscribe((event) => {
				if ((event.toState as StepContentPositionState) === 'current') {
					this.animationDone.emit();
				}
			});

		this.selectionChange.pipe(untilDestroyed(this)).subscribe((data) => {
			this.selectedIndexChange.emit(data.selectedIndex);
			// console.log('selectedIndexChange: ', data.selectedStep.content.elementRef);

			this.amplitudeService.saveEvent('form-stepper:step-changed', {
				selectedIndex: data.selectedIndex,
				isLastStep: data.selectedIndex === this.formSteps.length - 1,
				nbSteps: this.formSteps.length,
			});

			if (data.selectedIndex === this.steps.length - 1) {
				this.brokerService.broke(BROKE_OPTIONS.celebrateReset);
			}
		});

		this.steps.changes
			.pipe(
				untilDestroyed(this),
				tap(() => {
					setTimeout(() => {
						if (this.steps.length === this.formSteps.length && this.formProps.stepIdFocused) {
							this.goToStepId(this.formProps.stepIdFocused);
						}
					}, 100);
				})
			)
			.subscribe();

		// to get answer from the current step and check next conditions
		this.recordingSession$$$.$.pipe(
			untilDestroyed(this),
			tap((recSess) => {
				setTimeout(() => {
					if (recSess && this.selectedIndex == 0) {
						this.nextUntilIndex(1);
					}
				}, 200);
			})
		).subscribe();
	}

	selectStepByIndex(index: number): void {
		this.selectedIndex = index;
	}

	nextUntilIndex(index: number, ignoreValidityState = false, noTrackWarning = false): void {
		if (index === this.selectedIndex) return;

		if (index < this.selectedIndex) {
			this.selectStepByIndex(index);
			return;
		}

		for (let i = this.selectedIndex; i < index; i++) {
			if (i === 0) {
				this.next();
				continue;
			}

			if (this.guestFormsValidity[i] === true || ignoreValidityState || this.previewMode) {
				this.next(noTrackWarning);
			} else {
				this.notificationsService.warning('You must complete this step first.');
				break;
			}
		}
	}

	next(noTrackWarning = true): void {
		this._virtualPlayerService.pauseAllPlaylists();

		if (this.recordingProps.occupied) {
			return;
		}
		this.amplitudeService.saveEvent('form-stepper:call-next');

		this.brokerService.broke(BROKE_OPTIONS.stopPlaying);
		this.brokerService.broke(BROKE_OPTIONS.stopRecording);
		this.brokerService.broke(BROKE_OPTIONS.preloadSongs);

		if (this.guestFormsValidity[this.selectedIndex] === false && !this.previewMode) {
			this.notificationsService.warning('Your answer is not yet complete.');
			return;
		}

		let preventGoNext = false;

		const selectedStep = this.formSteps[this.selectedIndex];
		const recordingSession = this.recordingSession$$$.value;
		console.log('(recordingSession)', recordingSession);

		if (recordingSession) {
			const answer = this.answersManagementService
				.getAnswersForSession(recordingSession.id)
				.find((answer) => answer.stepId === selectedStep.id);
			if (answer) {
				const answerAttrsAsStr = answer.attrs;
				const answerAttrs: Attr = JSON.parse(answerAttrsAsStr);

				const profile = this.usersRepository.connectedUser$$.value;

				if (profile && selectedStep.kind === 'guest-info') {
					let userData: UserData = {};
					if (profile?.data) {
						userData = JSON.parse(profile.data);
					}

					// ask if fill profile picture if image request in guest info step
					if (answerAttrs.imageid && typeof answerAttrs.imageid === 'string') {
						if (
							userData.profilePictureUrl &&
							typeof userData.profilePictureUrl === 'string' &&
							userData.profilePictureUrl !== 'rs://' + answerAttrs.imageid
						) {
							// ask confirmation if already profile picture
							preventGoNext = true;
							this.notificationsService
								.confirm(
									'Profile picture',
									'Do you want to replace your current profile picture with this new picture?',
									'Ignore',
									'Yes, replace'
								)
								.subscribe((confirmed) => {
									if (confirmed) {
										const profilePictureUrl = 'rs://' + answerAttrs.imageid;
										this.usersRepository.addDataToConnectedUser({ profilePictureUrl });
									}

									super.next();
								});
						} else {
							const profilePictureUrl = 'rs://' + answerAttrs.imageid;
							this.usersRepository.addDataToConnectedUser({ profilePictureUrl });
						}
					}

					// fill firstName if missing
					if (answerAttrs.firstname && typeof answerAttrs.firstname === 'string' && !userData.firstName) {
						this.usersRepository.updateConnectedUser({ firstName: answerAttrs.firstname });
					}

					// fill lastName if missing
					if (answerAttrs.lastname && typeof answerAttrs.lastname === 'string' && !userData.lastName) {
						this.usersRepository.updateConnectedUser({ lastName: answerAttrs.lastname });
					}

					const profileKeysToFill = ['autoBiography', 'companyLink', 'twitterLink', 'linkedInLink'];
					profileKeysToFill.forEach((key) => {
						console.log('key: ', key, answerAttrs[key], userData[key]);

						if (answerAttrs[key] && typeof answerAttrs[key] === 'string' && !userData[key]) {
							this.usersRepository.addDataToConnectedUser({ [key]: answerAttrs[key] });
						}
					});
				}

				// ask confirmation to go next if no recording
				if (answerAttrs && answerAttrs.playlistid && typeof answerAttrs.playlistid === 'string' && noTrackWarning) {
					const activeTracks = this._TracksRepository
						.getTracks(answerAttrs.playlistid)
						.filter((track) => track.active === true);
					if (activeTracks.length === 0) {
						preventGoNext = true;
						this.notificationsService
							.confirm(
								t('formsLayout.formStepper.No recording'),
								t('formsLayout.formStepper.You have not recorded any answer yet.'),
								t('formsLayout.formStepper.Stay here'),
								t('formsLayout.formStepper.Go to next step'),
								undefined,
								undefined
							)
							.subscribe((confirmed) => {
								if (confirmed) {
									super.next();
								}
							});
						return;
					}
				}
			}
		}

		if (!preventGoNext) {
			if (this.selectedIndex === this.formSteps.length - 1) {
				// this.notificationsService.success('You have completed the form.');
				this.endReached.emit();
			}

			super.next();
		}
	}

	previous(): void {
		this._virtualPlayerService.pauseAllPlaylists();
		if (this.recordingProps.occupied) {
			return;
		}
		this.amplitudeService.saveEvent('form-stepper:call-next');

		this.brokerService.broke(BROKE_OPTIONS.stopPlaying);
		this.brokerService.broke(BROKE_OPTIONS.stopRecording);
		super.previous();
	}

	/**
	 * Check if some dialogs are open
	 * @param instanceOf class of dialog component to check. If not provided, it will check for any class
	 * @returns true if one or more dialogs are open
	 */
	dialogCurrentlyOpen(instanceOf?: any): boolean {
		const dialogsOpened = this._dialog.openDialogs;

		if (dialogsOpened.length < 1) return false;
		if (!instanceOf) return dialogsOpened.length > 0;

		const formOpenerDialog = dialogsOpened.filter((openDialog) => openDialog.componentInstance instanceof instanceOf);

		return formOpenerDialog.length > 0;
	}

	@HostListener('document:keydown', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		if ((this.dialogCurrentlyOpen() && !this.dialogCurrentlyOpen(FormOpenerPromptComponent)) || !event.target) {
			return;
		}
		const target = event.target as HTMLElement;

		if (target.tagName.toUpperCase() === 'BODY' || target.tagName.toUpperCase() === 'MAT-DIALOG-CONTAINER') {
			if (event.key === 'ArrowRight') {
				this.next();
			} else if (event.key === 'ArrowLeft') {
				this.previous();
			} else if (event.key === 'ArrowDown') {
				this.next();
			} else if (event.key === 'ArrowUp') {
				this.previous();
			} else if (event.key === 'Enter') {
				if (event.shiftKey) {
					this.previous();
				} else {
					this.next();
				}
			}
			// else if (event.key === 'Tab') {
			// 	if (event.shiftKey) {
			// 		this.previous();
			// 	} else {
			// 		this.next();
			// 	}
			// }
		} else if (target.tagName.toUpperCase() === 'INPUT') {
			if (event.key === 'Enter') {
				this.next();
			}
		} else if (target.tagName.toUpperCase() === 'TEXTAREA') {
			if (event.key === 'Enter' && event.shiftKey) {
				this.next();
			}
		}
	}

	goToStepId(stepId: string) {
		const index = this.formSteps.findIndex((step) => step.id === stepId);
		if (index > -1 && index < this.steps.length) this.selectStepByIndex(index);
	}

	// new move
	// was the move started from the bottom
	// was the move long enough
	@HostListener('mousewheel', ['$event']) // for window scroll events
	onScroll(event: WheelEvent) {
		try {
			const target =
				this.elementRef.nativeElement.children[this.selectedIndex].getElementsByClassName('step-container')[0]
					.parentElement;
			//check that target could use scroll

			const eventTarget = event.target as HTMLElement;
			const targettagName = eventTarget.tagName.toUpperCase();

			if (
				[
					'INPUT',
					'TEXTAREA',
					'SELECT',
					'MAT-SELECT',
					'MAT-CHECKBOX-GROUP',
					'MAT-CHECKBOX',
					'MAT-RADIO-GROUP',
					'MAT-RADIO-BUTTON',
					'MAT-RADIO-GROUP',
				].includes(targettagName)
			) {
				// console.log('wheel event on ', targettagName, ' - ignoring');
				return;
			}

			if (!target) return;
			// console.log({
			// 	//
			// 	deltaY: event.deltaY,
			// 	// pageY: event.pageY,
			// 	// clientY: event.clientY,
			// 	// offsetY: event.offsetY,
			// 	// screenY: event.screenY,
			// 	// movementY: event.movementY, => useless
			// 	scrollTop: target.scrollTop,
			// 	clientHeight: target.clientHeight,
			// 	scrollHeight: target.scrollHeight,
			// 	// offsetHeight: target.offsetHeight
			// 	target,
			// });
			this.processScroll$$.next({
				deltaY: event.deltaY,
				bottomReached: target.scrollTop + target.clientHeight >= target.scrollHeight,
				topReached: target.scrollTop <= 0,
			});
		} catch (e) {
			console.log(e);
		}
	}
}
