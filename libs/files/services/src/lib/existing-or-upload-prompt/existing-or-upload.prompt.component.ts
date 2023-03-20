import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { scopeLoader } from '@rumble-pwa/i18n';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';

@Component({
	selector: 'rumble-pwa-existing-or-upload-prompt',
	templateUrl: './existing-or-upload.prompt.component.html',
	styleUrls: ['./existing-or-upload.prompt.component.scss'],
	standalone: true,
	imports: [
		//
		MatButtonModule,
		MatDialogModule,
		MatIconModule,
		TrackClickDirective,
		TranslocoModule,
	],
	providers: [
		{
			provide: TRANSLOCO_SCOPE,
			useValue: {
				// this 2 lines are basically
				// saying "please load the json file into ABC namespace."
				// HTML will need to use at least "profileLayout." to use its content.
				scope: 'filesService',
				loader: scopeLoader((lang: string) => {
					return import(`../i18n/${lang}.json`);
				}),
			},
		},
	],
})
export class ExistingOrUploadPromptComponent {}
