import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ALL_STEP_INSTANCES, StepAttribute, StepInstance } from '@rumble-pwa/forms-system';
import { sortBy } from 'lodash';
import { startWith, tap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { NotificationsService } from '@rumble-pwa/client-notifications';

const STEP_CANDIDATE_PROPERTIES_ALLOWED = ['shortText', 'text', 'textList', 'paragraph', 'url', 'email'];

export interface StepToAppend {
	stepInstance: StepInstance;
	attribute: StepAttribute;
	inputText: string;
}

@Component({
	selector: 'rumble-pwa-multi-questions-prompt',
	templateUrl: './multi-questions-prompt.component.html',
	styleUrls: ['./multi-questions-prompt.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiQuestionsPromptComponent {
	stepsToAppend: StepToAppend[] = [];
	stepCandidates: StepInstance[] = [];
	stepCandidatesFiltered: StepInstance[] = []; // if form has welcome-step or termination

	numberOfStepsPending?: number;

	globalForm: FormGroup;
	stepPendingForms: FormGroup[] = [];
	stepPendingFormsValid = false;
	splitLinesToggleInitialValue = true;

	constructor(
		private _dialogRef: MatDialogRef<MultiQuestionsPromptComponent>,
		private _formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			hasWelcomeStep?: boolean;
			hasTerminationStep?: boolean;
		},
		private _notificationsService: NotificationsService
	) {
		_dialogRef.disableClose = true;
		_dialogRef.keydownEvents().subscribe((event) => {
			if (event.key === 'Escape') {
				this._notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
					if (confirmation) {
						this._dialogRef.close();
					}
				});
			}
		});
		_dialogRef.backdropClick().subscribe(() => {
			this._notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this._dialogRef.close();
				}
			});
		});

		// Form for new step
		this.globalForm = this._formBuilder.group({
			inputText: new FormControl('', Validators.required),
			splitLinesToggle: new FormControl(this.splitLinesToggleInitialValue),
		});

		// In order to filter candidates if the form has a welcome-step or termination already
		const uniqueStepsToFilter: string[] = [];
		if (data.hasWelcomeStep) uniqueStepsToFilter.push('welcome-step');
		if (data.hasTerminationStep) uniqueStepsToFilter.push('termination');

		const splitLinesToggleControl = this.globalForm.get('splitLinesToggle') as AbstractControl<boolean>;
		const inputTextControl = this.globalForm.get('inputText') as AbstractControl<string>;

		combineLatest([
			splitLinesToggleControl.valueChanges.pipe(startWith(this.splitLinesToggleInitialValue)),
			inputTextControl.valueChanges,
		])
			.pipe(
				tap(([splitLinesToggle, text]) => {
					this.updateStepForms(splitLinesToggle);
					this.updateNumberOfStepsPending(splitLinesToggle);
					this.stepPendingFormsValid =
						this.stepPendingForms.every((stepToGenerateFormValid) => stepToGenerateFormValid.valid) &&
						text?.length > 0;
				})
			)
			.subscribe();

		/**
		 * Filter all step instance which has attributes allowed
		 * Filter attributes allowed
		 * Filter stepInstance if welcome-step or termination and already in the form
		 * Sort by name
		 */
		this.stepCandidates = sortBy(
			ALL_STEP_INSTANCES.filter((stepInstance) => uniqueStepsToFilter.indexOf(stepInstance.stepDetail.name) < 0)
				.filter(
					(stepInstance) =>
						stepInstance.stepDetail.attributes.filter(
							(attribute) =>
								STEP_CANDIDATE_PROPERTIES_ALLOWED.includes(attribute.kind) && attribute.providerId === 'creator'
						).length > 0
				)
				.map((stepInstance) => {
					const stepInstanceAttributesFiltered: StepInstance = {
						...stepInstance,
						stepDetail: {
							...stepInstance.stepDetail,
							attributes: stepInstance.stepDetail.attributes.filter(
								(attribute) =>
									STEP_CANDIDATE_PROPERTIES_ALLOWED.includes(attribute.kind) &&
									attribute.providerId === 'creator'
							),
						},
					};
					return stepInstanceAttributesFiltered;
				}),
			['stepDetail.menuText']
		);

		this.stepCandidatesFiltered = [...this.stepCandidates];
	}

	dismiss() {
		this._notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
			if (confirmation) {
				this._dialogRef.close();
			}
		});
	}

	autoSetFirstAttribute(stepPendingForm: FormGroup, event: MatSelectChange) {
		const stepInstance: StepInstance | undefined = event.source.value;
		if (!stepInstance) return;
		const firstAttributeFromStepInstance: StepAttribute = stepInstance.stepDetail.attributes[0];
		stepPendingForm.patchValue({ attribute: firstAttributeFromStepInstance });
	}

	addPendingStepsToStepsToAppend() {
		this.stepPendingForms.forEach((stepToGenerateForm) => {
			const newStepToAppend: StepToAppend = {
				stepInstance: stepToGenerateForm.get('stepInstance')?.value,
				attribute: stepToGenerateForm.get('attribute')?.value,
				inputText: stepToGenerateForm.get('inputText')?.value,
			};
			this.stepsToAppend.push(newStepToAppend);
		});

		this.globalForm.patchValue({
			inputText: undefined,
			splitLinesToggle: this.splitLinesToggleInitialValue,
		});

		this.stepPendingForms[0]?.patchValue({
			stepInstance: undefined,
			attribute: undefined,
		});

		this.globalForm.markAsUntouched();
	}

	deleteStepToAppend(stepToAppendIndex: number) {
		this.stepsToAppend.splice(stepToAppendIndex, 1);
	}

	appendQuestions() {
		this._dialogRef.close(this.stepsToAppend);
	}

	submit() {
		this.addPendingStepsToStepsToAppend();
		this.appendQuestions();
	}

	getStepCandidatesFiltered() {
		const hasWelcomeStep =
			this.stepsToAppend.find((step) => step.stepInstance.stepDetail.name === 'welcome-step') ||
			this.stepPendingForms.find((form) => form.get('stepInstance')?.value?.stepDetail.name === 'welcome-step');
		const hasTermination =
			this.stepsToAppend.find((step) => step.stepInstance.stepDetail.name === 'termination') ||
			this.stepPendingForms.find((form) => form.get('stepInstance')?.value?.stepDetail.name === 'termination');

		const uniqueStepsToFilter: string[] = [];
		if (hasWelcomeStep) uniqueStepsToFilter.push('welcome-step');
		if (hasTermination) uniqueStepsToFilter.push('termination');

		return [
			...this.stepCandidates.filter((stepCandidate) => uniqueStepsToFilter.indexOf(stepCandidate.stepDetail.name) < 0),
		];
	}

	isUniqueStepInstance(form?: FormGroup, stepInstance?: StepInstance) {
		const isUniqueStepInstanceFromForm = ['welcome-step', 'termination'].indexOf(
			form?.get('stepInstance')?.value?.stepDetail.name
		);
		const isUniqueStepInstance = ['welcome-step', 'termination'].indexOf(stepInstance?.stepDetail.name ?? '');
		return isUniqueStepInstanceFromForm > -1 || isUniqueStepInstance > -1;
	}

	updateNumberOfStepsPending(splitLinesToggleValue?: boolean) {
		this.numberOfStepsPending = splitLinesToggleValue
			? this.getTextsFromTextArea(splitLinesToggleValue).length ?? undefined
			: undefined;
	}

	updateStepForms(splitLinesToggleValue?: boolean) {
		const textsToConvert = this.getTextsFromTextArea(splitLinesToggleValue);

		if (!splitLinesToggleValue) {
			if (this.stepPendingForms.length) {
				this.stepPendingForms.splice(1);
			} else {
				this.stepPendingForms = [
					this._formBuilder.group({
						stepInstance: new FormControl(this.stepCandidatesFiltered[0], Validators.required),
						attribute: new FormControl(
							this.stepCandidatesFiltered[0].stepDetail.attributes[0],
							Validators.required
						),
						inputText: new FormControl(this.globalForm.get('inputText')?.value, Validators.required),
					}),
				];
			}
		} else {
			if (this.stepPendingForms.length > textsToConvert.length) {
				this.stepPendingForms.splice(textsToConvert.length);
			} else {
				for (let i = this.stepPendingForms.length; i < textsToConvert.length; i++) {
					const newStepToGenerateForm = this._formBuilder.group({
						stepInstance: new FormControl(this.stepCandidatesFiltered[0], Validators.required),
						attribute: new FormControl(
							this.stepCandidatesFiltered[0].stepDetail.attributes[0],
							Validators.required
						),
						inputText: new FormControl(textsToConvert[i], Validators.required),
					});
					this.stepPendingForms.push(newStepToGenerateForm);
				}
			}
		}
		textsToConvert.forEach((text, index) => {
			this.stepPendingForms[index]?.patchValue({
				inputText: text,
			});
		});
	}

	getTextsFromTextArea(splitLinesToggleValue?: boolean) {
		const textInput: string = this.globalForm.get('inputText')?.value;
		const texts = (splitLinesToggleValue ? textInput?.split('\n') ?? [] : [textInput]).filter((text) => !!text);
		return texts;
	}

	stepsToAppendValid() {
		return this.stepsToAppend.every(
			(stepToAppend) => stepToAppend.inputText?.length > 0 && stepToAppend.attribute && stepToAppend.stepInstance
		);
	}

	allStepPendingFormsValid() {
		return this.stepPendingForms.every((stepPendingForm) => stepPendingForm.valid);
	}
}
