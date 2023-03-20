import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';
import { Page, PagesRepository } from '@rumble-pwa/pages/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-page-list',
	standalone: true,
	imports: [
		//
		CommonModule,
		ObjectListComponent,
		ObjectColumnComponent,
		MatTooltipModule,
		RouterModule,
		MatIconModule,
		MatButtonModule,
		MatMenuModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './page-list.component.html',
	styleUrls: ['./page-list.component.scss'],
})
export class PageListComponent extends LayoutSizeAndCheck implements CanCheck, CanBeDebugged, HasLayoutSize {
	@Input()
	pages: Page[] = [];
	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _router: Router,
		private _layoutRepository: LayoutRepository,
		private _notificationsService: NotificationsService,
		private _pagesRepository: PagesRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			displaySidebarLeft: 'auto',
			displayBurgerMenu: 'auto',
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Pages',
					link: undefined,
				},
			],
		});
	}

	processTableClick(event: TableClickEvent<any>) {
		if (event.object) this._router.navigate(['/pages', event.object?.id]);
	}

	public deletePage(page: Page) {
		this._notificationsService
			.confirmWithInput(
				'Are you sure to delete this page "' + page.name + '"?',

				'This page has the following slug: ' + page.pattern,
				page.name ?? page.publicTitle ?? page.pattern ?? 'delete forever'
			)
			.subscribe((confirm) => {
				if (confirm) {
					this._pagesRepository.updatePage(page.id, {
						state: 'deleted',
					});
				}
			});
	}
}
