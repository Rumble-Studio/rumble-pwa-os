import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AnswersManagementService } from '@rumble-pwa/forms-system';
import { Answer, RecordingSession } from '@rumble-pwa/mega-store';
import { last, sum } from 'lodash';

@Component({
	selector: 'rumble-pwa-session-selector',
	templateUrl: './session-selector.component.html',
	styleUrls: ['./session-selector.component.scss'],
})
export class SessionSelectorComponent {
	_selectedSession?: string;
	get selectedSession() {
		return this._selectedSession;
	}
	set selectedSession(v) {
		this._selectedSession = v;
	}

	recordingSessionIds: RecordingSession['id'][];
	answersPerSession: number[];
	formId: string;
	personalAnswers: Answer[];
	currentRecordingSessionId: RecordingSession['id'];

	constructor(
		@Inject(MAT_DIALOG_DATA)
		public data: {
			currentRecordingSessionId: RecordingSession['id'];
			formId: string;
			recordingSessionIds: RecordingSession['id'][];
		},
		private dialogRef: MatDialogRef<SessionSelectorComponent>,
		private answersManagementService: AnswersManagementService
	) {
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.dismiss();
		});

		dialogRef.keydownEvents().subscribe((event) => {
			if (event.key === 'Escape') {
				this.dismiss();
			}
		});

		this.currentRecordingSessionId = data.currentRecordingSessionId;

		this.recordingSessionIds = data.recordingSessionIds;
		this.currentRecordingSessionId
			? (this.selectedSession = this.currentRecordingSessionId)
			: (this.selectedSession = last(this.recordingSessionIds));
		this.formId = data.formId;
		this.personalAnswers = this.answersManagementService.getPersonalFormAnswers(this.formId);
		this.answersPerSession = this.recordingSessionIds
			.map((recordingSessionId) =>
				this.personalAnswers
					.filter((answer) => answer.recordingSessionId == recordingSessionId)
					.map((answer) => answer.attrs)
					.map((attrs) => {
						return attrs.length > 0;
					})
			)
			.map((numberOfTracksPerPlaylist) => sum(numberOfTracksPerPlaylist));
	}

	confirm() {
		console.log('confirm', this.selectedSession);
		this.dialogRef.close(this.selectedSession);
	}

	dismiss() {
		console.log('Dismiss', this.selectedSession);
		this.dialogRef.close(this.selectedSession);
	}

	generateNewSession() {
		const d = new Date();
		// d.setHours(0, 0, 0, 0);
		const now = d.getTime();

		this.dialogRef.close(now);
	}
}
