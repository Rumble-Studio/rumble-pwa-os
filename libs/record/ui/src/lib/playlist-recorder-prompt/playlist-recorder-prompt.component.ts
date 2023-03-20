import { Component, Inject, Input, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrokerService } from '@rumble-pwa/broker-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
// import { PlaylistRecorderComponent } from '../playlist-recorder/playlist-recorder.component';

@Component({
	selector: 'rumble-pwa-playlist-recorder-prompt',
	templateUrl: './playlist-recorder-prompt.component.html',
	styleUrls: ['./playlist-recorder-prompt.component.scss'],
})
export class PlaylistRecorderPromptComponent {
	playlistId: string;

	// @ViewChild('playlistRecorder', { static: false })
	// playlistRecorder!: PlaylistRecorderComponent;

	constructor(
		private dialogRef: MatDialogRef<PlaylistRecorderPromptComponent>,
		@Inject(MAT_DIALOG_DATA)
		public data: { playlistId: string },
		private notificationsService: NotificationsService,
		private brokerService: BrokerService
	) {
		this.playlistId = data.playlistId;
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this.dialogRef.close();
				}
			});
		});
	}

	cancel() {
		// this.playlistRecorder.stopRecording();
		this.brokerService.broke('stopRecording');

		this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
			if (confirmation) {
				this.dialogRef.close();
			}
		});
	}

	submit() {
		// this.playlistRecorder.stopRecording();
		this.brokerService.broke('stopRecording');

		this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
			if (confirmation) {
				this.dialogRef.close({
					playlistId: this.playlistId,
				});
			}
		});
	}
}
