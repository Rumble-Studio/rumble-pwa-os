import { Component, Input } from '@angular/core';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'v-space',
	templateUrl: './v-space.component.html',
	styleUrls: ['./v-space.component.scss'],
})
export class VSpaceComponent {
	/**
	 * Size of the spacer
	 */
	@Input()
	height = '5px';
}
