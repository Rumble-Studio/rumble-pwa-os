import { Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
	ALL_STEP_INSTANCES,
	AnswersManagementService,
	FormsManagementService,
	StepsManagementService,
} from '@rumble-pwa/forms-system';
import { Answer, Form, Step } from '@rumble-pwa/mega-store';
import { DataObsViaId } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-recording-session-short-preview',
	templateUrl: './recording-session-short-preview.component.html',
	styleUrls: ['./recording-session-short-preview.component.scss'],
})
export class RecordingSessionShortPreviewComponent {
	private _selectedRecordedSessionId?: string;
	@Input()
	public set selectedRecordedSessionId(value: string | undefined) {
		this._selectedRecordedSessionId = value;
		this.loadAnswers();
	}
	public get selectedRecordedSessionId(): string | undefined {
		return this._selectedRecordedSessionId;
	}

	form$$$: DataObsViaId<Form> = new DataObsViaId<Form>((formId: string) => this.formsManagementService.get$(formId));

	private _formId?: string;
	@Input()
	public set formId(newFormId: string | undefined) {
		this._formId = this.formId;
		this.form$$$.id = newFormId;
	}
	public get formId(): string | undefined {
		return this._formId;
	}

	steps: Step[] = [];
	stepAnswers: { [key: string]: Answer } = {};

	constructor(
		private answersManagementService: AnswersManagementService,
		private stepsManagementService: StepsManagementService,
		private formsManagementService: FormsManagementService
	) {
		this.form$$$.$.pipe(
			untilDestroyed(this),
			switchMap((form) => {
				if (form) {
					return this.stepsManagementService.getFormSteps$(form.id);
				}
				return of([]);
			}),
			tap((steps) => {
				this.steps = steps.filter(
					(step) =>
						!ALL_STEP_INSTANCES.find((stepInstance) => stepInstance.stepDetail.name === step.kind)
							?.hideInRecordingSessionList
				);
			})
		).subscribe();
	}

	loadAnswers() {
		if (!this.selectedRecordedSessionId) {
			// this.notificationsService.warning('Please select a session to export');
			this.stepAnswers = {};
			return;
		}

		const answers = this.answersManagementService.getAnswersForSession(this.selectedRecordedSessionId);
		this.stepAnswers = {};
		answers.forEach((answer) => {
			this.stepAnswers[answer.stepId] = answer;
		});
	}

	hasToBeDisplayed(stepkind: string) {
		return !(stepkind.includes('audio') || stepkind.includes('video') || stepkind.includes('welcome'));
	}
}
