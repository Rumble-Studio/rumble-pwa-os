import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityFile, Filetag } from '@rumble-pwa/files/models';
import { FiletagsRepository } from '@rumble-pwa/filetags/state';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-filetag-list-page',
	templateUrl: './filetag-list-page.component.html',
	styleUrls: ['./filetag-list-page.component.scss'],
})
export class FiletagListPageComponent {
	filetags: Filetag[] = [];
	constructor(private filetagsRepository: FiletagsRepository) {
		this.filetagsRepository.filetags$.pipe(untilDestroyed(this)).subscribe((files) => {
			this.filetags = files;
		});
	}

	onFiletagClick(filetag: EntityFile) {
		console.log('clicked:', filetag);
	}
}
