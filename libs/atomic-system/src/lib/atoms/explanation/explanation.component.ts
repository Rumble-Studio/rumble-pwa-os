import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'explanation',
	templateUrl: './explanation.component.html',
	styleUrls: ['./explanation.component.scss'],
	standalone: true,
	imports: [CommonModule, MatTooltipModule, TrackClickDirective],
})
export class ExplanationComponent {
	@ViewChild('tooltip') tooltip?: MatTooltip;
	@Input() msg!: string;
	@Input() ariaMsg = '';
}
