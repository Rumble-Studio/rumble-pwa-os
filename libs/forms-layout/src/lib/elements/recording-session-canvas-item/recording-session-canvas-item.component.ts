import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FilesRepository } from '@rumble-pwa/files/state';
import { AnswersManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { RecordingSessionListItem } from '@rumble-pwa/mega-store';
import { DataObsViaId } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-recording-session-canvas-item',
	templateUrl: './recording-session-canvas-item.component.html',
	styleUrls: ['./recording-session-canvas-item.component.scss'],
})
export class RecordingSessionCanvasItemComponent {
	_recordingSessionListItem?: RecordingSessionListItem;
	@Input()
	public set recordingSessionListItem(v) {
		this._recordingSessionListItem = v;
		if (!v) return;

		const answers = this.answersManagementService.getAnswersForSession(v.recordingSession.id);
		answers.forEach((answer) => {
			const attrs = JSON.parse(answer.attrs ?? '{}');
			if (!attrs.imageid) return;
			this.image$$$.id = attrs.imageid;
		});
	}

	public get recordingSessionListItem() {
		return this._recordingSessionListItem;
	}

	image$$$ = new DataObsViaId<string>((imageId: string) => this._filesRepository.convertEntityFileIdToUrl$(imageId));

	constructor(
		private _filesRepository: FilesRepository,
		private cdr: ChangeDetectorRef,
		private answersManagementService: AnswersManagementService,
		private recordingSessionsManagementService: RecordingSessionsManagementService
	) {
		this.image$$$.$.pipe(
			untilDestroyed(this),
			tap(() => {
				this._check();
			})
		).subscribe();
	}

	listenTo(recordingSessionId: string) {
		this.recordingSessionsManagementService.listenTo(recordingSessionId);
	}

	private _check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
