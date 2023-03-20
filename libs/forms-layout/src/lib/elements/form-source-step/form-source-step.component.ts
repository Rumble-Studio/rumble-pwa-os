import { Component, Input } from '@angular/core';

@Component({
	selector: 'rumble-pwa-form-source-step',
	templateUrl: './form-source-step.component.html',
	styleUrls: ['./form-source-step.component.scss'],
})
export class FormSourceStepComponent {
	@Input() menuHint = 'Insert this step.';
	@Input() icon?: string;
	@Input() menuText?: string;
	@Input() isDesktop = true;
	@Input() favoriteStep? = false;
}
