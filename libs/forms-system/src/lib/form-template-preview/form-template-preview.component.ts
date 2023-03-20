import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FormTemplate, getStepIconFromStepKind, getStepMenuTextFromStepKind } from '../config/steps.config';

@Component({
	selector: 'rumble-pwa-form-template-preview',
	templateUrl: './form-template-preview.component.html',
	styleUrls: ['./form-template-preview.component.scss'],
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		//
		CommonModule,
		MatIconModule,
		TrackClickDirective,
	],
})
export class FormTemplatePreviewComponent {
	@Input() formTemplate?: FormTemplate;

	public getStepIconFromStepKind = getStepIconFromStepKind;
	public getStepMenuTextFromStepKind = getStepMenuTextFromStepKind;
}
