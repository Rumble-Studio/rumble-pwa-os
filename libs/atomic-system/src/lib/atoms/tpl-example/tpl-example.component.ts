import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
	selector: 'rumble-pwa-tpl-example',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './tpl-example.component.html',
	styleUrls: ['./tpl-example.component.scss'],
})
export class TplExampleComponent {
	@ViewChild('myDummyTemplate')
	public dummyTemplate?: TemplateRef<any>;
}
