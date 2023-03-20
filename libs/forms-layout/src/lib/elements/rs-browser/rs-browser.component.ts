import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotificationsService } from '@rumble-pwa/client-notifications';

type ViewMode = 'desktop' | 'mobile';

@Component({
	selector: 'rumble-pwa-rs-browser',
	templateUrl: './rs-browser.component.html',
	styleUrls: ['./rs-browser.component.scss'],
})
export class RsBrowserComponent {
	@Input() formUrl = '';

	@Input()
	viewMode: ViewMode = 'desktop';

	@Output()
	viewModeChange = new EventEmitter<ViewMode>();

	@Output()
	clickColorEvent = new EventEmitter<string>();

	constructor(private notificationsService: NotificationsService) {}

	processCopyToClipboardEvent(copied: boolean) {
		if (copied) {
			this.notificationsService.success('Content copied!', undefined, undefined, undefined, 1000);
		} else {
			this.notificationsService.error('Error while copying');
		}
	}

	toggleView(view?: ViewMode) {
		this.viewMode = view ?? (this.viewMode === 'desktop' ? 'mobile' : 'desktop');
		this.viewModeChange.emit(this.viewMode);
	}

	processClickColor(color: string) {
		this.clickColorEvent.emit(color);
	}
}
