import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LayoutRepository } from '@rumble-pwa/layout/state';
import { filter, map, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-download-page',
	templateUrl: './download-page.component.html',
	styleUrls: ['./download-page.component.scss'],
})
export class DownloadPageComponent {
	fileId?: string;
	constructor(private activatedRoute: ActivatedRoute, private _layoutRepository: LayoutRepository) {
		this.activatedRoute.params
			.pipe(
				untilDestroyed(this),
				map((params) => {
					if (params.fileId && params.fileId.length) {
						return params.fileId as string;
					} else {
						return '';
					}
				}),
				tap((fileId) => {
					this.fileId = fileId;
				}),
				filter((fileId: string) => {
					return !!fileId;
				})
			)
			.subscribe();

		this._layoutRepository.setLayoutProps({
			displayHeader: true,
			displayBurgerMenu: true,
			displayFooter: false,
			displaySidebarLeft: false,
		});
	}
}
