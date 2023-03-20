import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { RecordingSessionListItem } from '@rumble-pwa/mega-store';
import { DataObsViaId, getRouteParam$ } from '@rumble-pwa/utils';
import { combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-recording-session-canvas',
	templateUrl: './recording-session-canvas.component.html',
	styleUrls: ['./recording-session-canvas.component.scss'],
})
export class RecordingSessionCanvasComponent {
	recordingSessionListItems$$$ = new DataObsViaId((formId: string) =>
		this.recordingSessionsManagementService.getFormSessions$(formId).pipe(
			switchMap((recordingSessions) => {
				return combineLatest(
					recordingSessions.map((recordingSession) =>
						this.recordingSessionsManagementService.getRecordingSessionListItem$(recordingSession.id)
					)
				);
			}),
			map((recordingSessionItems) => {
				return recordingSessionItems.filter((child): child is RecordingSessionListItem => !!child);
			})
		)
	);

	constructor(
		private recordingSessionsManagementService: RecordingSessionsManagementService,
		private notificationsService: NotificationsService,
		private activatedRoute: ActivatedRoute,
		private router: Router
	) {
		// read param from route
		getRouteParam$(this.activatedRoute, 'formId')
			.pipe(
				untilDestroyed(this),
				tap((formId) => {
					if (formId && formId.length > 36) {
						this.notificationsService.warning('Interview not found.');
						this.router.navigate(['/forms']);
					}
					this.recordingSessionListItems$$$.id = formId;
				})
			)
			.subscribe();
	}
}
