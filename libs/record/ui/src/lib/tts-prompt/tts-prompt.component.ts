import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { TtsService } from '@rumble-pwa/record-system';

@Component({
	selector: 'rumble-pwa-tts-prompt',
	templateUrl: './tts-prompt.component.html',
	styleUrls: ['./tts-prompt.component.scss'],
})
export class TtsPromptComponent {
	_textToSpeechify = '';
	textToSpeechify = '';
	speechifiedTextUrl = '';
	_selectedVoice = '';
	selectedVoice = '';
	voices = [
		{
			value: 'eric',
			viewValue: 'Eric',
		},
		{
			value: 'stan',
			viewValue: 'Stan',
		},
		{
			value: 'kyle',
			viewValue: 'Kyle',
		},
		{
			value: 'kenny',
			viewValue: 'Kenny',
		},
		{
			value: 'wendy',
			viewValue: 'Wendy',
		},
	];
	waitingForResponse = false;
	speechifyBtnDisabled = true;

	constructor(
		private dialogRef: MatDialogRef<TtsPromptComponent>,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			textToSpeechify?: string;
			speechifiedTextUrl?: string;
		},
		private notificationsService: NotificationsService,
		private ttsService: TtsService
	) {
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this.dialogRef.close();
				}
			});
		});
		this.textToSpeechify = data?.textToSpeechify || this.textToSpeechify;
		this.speechifiedTextUrl = data?.speechifiedTextUrl || this.speechifiedTextUrl;
	}

	onCancel() {
		this.dialogRef.close();
	}

	onSubmit() {
		this.dialogRef.close();
	}

	speechify() {
		this.speechifiedTextUrl = '';
		this.waitingForResponse = true;
		this.ttsService.textToSpeech(this.textToSpeechify, this.selectedVoice).subscribe((res) => {
			console.log(res.tts.voice + " will read '" + res.tts.text + "'");
		});

		// FAKE DEMO
		setTimeout(() => {
			this.waitingForResponse = false;
			this.speechifiedTextUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
			this._textToSpeechify = this.textToSpeechify;
			this._selectedVoice = this.selectedVoice;
		}, 3000);
	}
}
