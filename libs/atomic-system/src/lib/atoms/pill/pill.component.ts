import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';

@Component({
	selector: 'pill',
	standalone: true,
	imports: [CommonModule, ClipboardModule, TrackClickDirective],
	templateUrl: './pill.component.html',
	styleUrls: ['./pill.component.scss'],
})
export class PillComponent {
	@Input()
	contentToCopy?: string;

	constructor(private _notificationsService: NotificationsService) {}

	processCopyToClipboardEvent(copied: boolean) {
		if (copied) {
			this._notificationsService.success('Copied!', undefined, undefined, undefined, 1000);
		} else {
			this._notificationsService.error('Error while copying');
		}
	}
}
