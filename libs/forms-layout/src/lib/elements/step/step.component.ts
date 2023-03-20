import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControlStatus } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import {
	AnswersManagementService,
	Provider,
	RecordingSessionsManagementService,
	stepMergeCustomizer,
} from '@rumble-pwa/forms-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Answer, FormCustomisationDetails, RecordingSession, Step } from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { Attr, DataObsViaId, rslog } from '@rumble-pwa/utils';
import { mergeWith } from 'lodash';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { FormStepperComponent } from '../form-stepper/form-stepper.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-step',
	templateUrl: './step.component.html',
	styleUrls: ['./step.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	answerAttrs: Attr = {};

	attrs: Attr = {};

	@Output() guestFormIsValidChange = new EventEmitter<FormControlStatus | undefined>();
	private _guestFormIsValid?: FormControlStatus | undefined;
	public get guestFormIsValid() {
		return this._guestFormIsValid;
	}
	public set guestFormIsValid(value) {
		this._guestFormIsValid = value;
		this.guestFormIsValidChange.emit(value);
	}

	index?: number;

	step$$ = new BehaviorSubject<Step | undefined>(undefined);

	_step?: Step;
	public get step() {
		return this._step;
	}
	public set step(newStep) {
		this._step = newStep;
		if (newStep) {
			this.attrs = JSON.parse(newStep.attrs);
		}
		this.step$$.next(newStep);
		this._check();
	}

	@Input()
	previewMode = false;

	private _answerId?: string;
	public get answerId() {
		return this._answerId;
	}
	public set answerId(value) {
		this._answerId = value;
		// if (value && this.step?.kind === 'welcome-step' && this.isSelected && (this.stepper?.formSteps.length ?? 0) > 1) {
		// 	// setTimeout(() => {
		// 	this.forwardEmitter.emit('next');
		// 	// }, 200);
		// }
	}

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

	providerId: Provider['id'] = 'default-participant';

	// private _userId?: string;
	// public get userId() {
	// 	return this._userId;
	// }
	// @Input()
	// public set userId(newUserId) {
	// 	this._userId = newUserId;
	// }

	user$$ = new BehaviorSubject<User | undefined>(undefined);

	public get user() {
		return this.user$$.value;
	}
	@Input()
	public set user(value) {
		this.user$$.next(value);
	}

	stepper?: FormStepperComponent;

	private _stepDetails?: {
		stepper?: FormStepperComponent;
		step?: Step;
		providerId?: Provider['id'];
		index: number;
		selectedIndex?: number;
		formCustomisation?: FormCustomisationDetails;
	};
	public get stepDetails() {
		return this._stepDetails;
	}
	@Input()
	public set stepDetails(newStepDetails) {
		this._stepDetails = newStepDetails;
		if (newStepDetails) {
			this.stepper = newStepDetails.stepper;
			this.step = newStepDetails.step;
			this.providerId = newStepDetails.providerId ?? 'default-participant';
			this.index = newStepDetails.index;
			this.selectedIndex = newStepDetails.selectedIndex;
			this.formCustomisation = newStepDetails.formCustomisation;
			// console.log('[step]stepDetails.index', this.index);
		}
	}

	private _selectedIndex?: number;
	public get selectedIndex() {
		return this._selectedIndex;
	}
	public set selectedIndex(value) {
		this._selectedIndex = value;
		if (value === this.index) {
			this.isSelected = true;
			const lastReachedAt = Math.floor(Date.now() / 1000);
			const lastReachedAtStr = JSON.stringify({
				lastReachedAt,
			});

			this.processAnswerEvent(lastReachedAtStr);
		} else {
			this.isSelected = false;
		}
	}

	isSelected = false;
	formCustomisation?: FormCustomisationDetails;

	@Input()
	showHostAvatar = false;

	@Output() forwardEmitter = new EventEmitter<string>();

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private notificationsService: NotificationsService,
		private answersManagementService: AnswersManagementService,
		private recordingSessionsManagementService: RecordingSessionsManagementService
	) {
		super(_cdr, _layoutService, _activatedRoute);
		// generate ANSWER_ID (unique for step, user and recording session) (deterministic)
		// and fill answerAttrs

		combineLatest([this.recordingSession$$$.$, this.step$$, this.user$$])
			.pipe(
				untilDestroyed(this),
				filter(([recordingSession, step, user]) => !!user?.id && !!recordingSession?.id && !!step?.id),
				switchMap(([recordingSession, step, user]) => {
					if (!recordingSession) {
						return of(undefined);
					}
					// const userId = this.usersRepository.connectedUser$$.value?.id;
					if (recordingSession.timeCreation && step?.id && user?.id) {
						// the answerId is based on:
						// - the recordingSession creation time
						// - the last part of the step id
						// - the user id
						const answerId =
							recordingSession.timeCreation * 1000 +
							'-' +
							user.id +
							'-' +
							step.id.substring(step.id.length, step.id.length - 12);
						this.answerId = answerId;
						return this.answersManagementService.get$(answerId);
					} else {
						console.log('[StepComponent] missing recordingSession.timeCreation or step.id or user.id', {
							recordingSessionId: recordingSession?.id,
							stepKind: step?.kind,
							userId: user?.id,
						});
					}
					return of(undefined);
				}),
				tap((answer) => {
					if (answer) {
						this.answerAttrs = JSON.parse(answer.attrs);
					}
				})
			)
			.subscribe();
	}

	previewWarning() {
		this.notificationsService.warning('This action is not available in preview mode.');
	}

	processAnswerEvent(attrsAsString: string) {
		this.recordingSession$$$.$.pipe(
			untilDestroyed(this),
			filter((recordingSession) => !!recordingSession?.id),
			take(1),
			tap(() => {
				this._processAnswerEventLoggedin(attrsAsString);
			})
		).subscribe();
	}

	/**
	 * Process indeed the attrsAsString, to be called only by porcessAnswerEvent and will only be called if a recordingSessionId is available
	 * @param attrsAsString
	 * @returns
	 */
	private _processAnswerEventLoggedin(attrsAsString: string) {
		// logger and filter on preview mode
		if (this.answerId && !this.previewMode && this.step?.id) {
			if (this._debug)
				rslog(this, 'emitAnswer:processing', 'blue', {
					stepKind: this.step.kind,
					attrsAsString,
				});
		} else {
			if (this._debug)
				rslog(this, 'emitAnswer:ignoring', 'orange', {
					answerId: this.answerId,
					recordingSessionId: this.recordingSessionId,
					previewMode: this.previewMode,
					attrsAsString,
					step: this.step,
				});
			return;
		}

		if (!this.user?.id) {
			throw new Error('No user id found.');
		}

		if (this.answerId && this.recordingSessionId) {
			const existingAnswer = this.answersManagementService.get(this.answerId);
			if (!existingAnswer) {
				const answer: Answer = {
					id: this.answerId,
					formId: this.step.formId,
					ownerId: this.user.id,
					recordingSessionId: this.recordingSessionId,
					stepId: this.step.id,
					userId: this.user.id,
					attrs: attrsAsString,
				};
				this.answersManagementService.upsert(answer);
			} else {
				const attrsToUpdate = JSON.parse(existingAnswer.attrs);
				if (!attrsToUpdate.reachedAt) {
					attrsToUpdate.reachedAt = Math.floor(Date.now() / 1000);
				}
				// console.log(
				//   'merging existing attrs with new attrs INIT',
				//   JSON.stringify(attrsToUpdate, null, 2)
				// );
				const newAttrs = JSON.parse(attrsAsString);
				if (!newAttrs.lastReachedAt) {
					attrsToUpdate.lastEditedAt = Math.floor(Date.now() / 1000);
				}
				// console.log(
				//   'merging existing attrs with new attrs UPDA',
				//   JSON.stringify(newAttrs)
				// );
				mergeWith(attrsToUpdate, newAttrs, stepMergeCustomizer);
				// console.log('merging existing attrs with new attrs FINA', JSON.stringify(attrsToUpdate, null, 2));
				this.answersManagementService.update(this.answerId, {
					attrs: JSON.stringify(attrsToUpdate),
				});
				this._check();
			}
		} else {
			console.warn('Missing answerId or recordingSessionId', {
				answerId: this.answerId,
				recordingSessionId: this.recordingSessionId,
			});
		}
	}

	forward(order: string) {
		this.forwardEmitter.emit(order);
	}
}
