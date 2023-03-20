import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { RestService } from '@rumble-pwa/requests';

@Component({
	selector: 'rumble-pwa-downloader',
	templateUrl: './downloader.component.html',
	styleUrls: ['./downloader.component.scss'],
	standalone: true,
	imports: [CommonModule, MatButtonModule, TrackClickDirective],
})
export class DownloaderComponent {
	@Input()
	downloadMessage = 'Download';

	fileUrl?: string;

	_fileId?: string;
	@Input()
	set fileId(fileId: string | undefined) {
		if (this._fileId === fileId) return;
		this._fileId = fileId;
		this.fileUrl = this._restService.apiRoot + '/files/' + fileId + '/download';
	}
	get fileId(): string | undefined {
		return this._fileId;
	}
	constructor(private _restService: RestService) {}
}
