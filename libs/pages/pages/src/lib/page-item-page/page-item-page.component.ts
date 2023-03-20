import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MetaDataService } from '@rumble-pwa/atomic-system';
import { FilesRepository } from '@rumble-pwa/files/state';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { getFaviconUriFromPageData, Page, PageData, PagesRepository } from '@rumble-pwa/pages/state';
import { PageItemComponent } from '@rumble-pwa/pages/ui';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { map, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-page-item-page',
	standalone: true,
	imports: [
		//,
		CommonModule,
		PageItemComponent,
		MatMenuModule,
		TrackClickDirective,
	],
	templateUrl: './page-item-page.component.html',
	styleUrls: ['./page-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageItemPageComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck, OnDestroy {
	/**
	 * Page to display
	 * The page object isself is used for the page segment even if only the id is given to the page-item component
	 */
	public page$$$ = new DataObsViaId<Page>((pageId: string) => this._pagesRepository.get$(pageId));

	pages: Page[] = [];

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;
	@ViewChild(PageItemComponent) pageItem?: PageItemComponent;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _layoutRepository: LayoutRepository,
		private _pagesRepository: PagesRepository,
		private _router: Router,
		private _filesRepository: FilesRepository,
		private _metaDataService: MetaDataService
	) {
		super(_cdr, _layoutService, _activatedRoute);
		// read param from route
		getRouteParam$(this._activatedRoute, 'id')
			.pipe(
				untilDestroyed(this),
				tap((objectId) => {
					this.page$$$.id = objectId;
				})
			)
			.subscribe();

		// Subcribe to page$$$ to fill lthe favicon thumbnail
		this.page$$$.$.pipe(
			untilDestroyed(this),
			map((page) => {
				const defaultPageData: PageData = {};
				const pageData = page?.data ? JSON.parse(page.data) : defaultPageData;
				const faviconUri = getFaviconUriFromPageData(pageData);
				return faviconUri;
			}),
			switchMap((faviconUri) => this._filesRepository.convertURIToObjectThumbnail$(faviconUri)),
			tap((faviconThumbnail) => {
				if (faviconThumbnail?.imageUrl) this._metaDataService.setFavicon(faviconThumbnail.imageUrl);
				this._check();
			})
		).subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.page$$$.$.pipe(
			untilDestroyed(this),
			tap((page) => {
				if (page) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						displayBurgerMenu: 'auto',
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Pages',
								link: '/pages',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-pages-menu',
							},
							{
								title: page.name + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-page-editor',
								tooltip: 'Edit page properties',
							},
						],
					});
				}
				this._check();
			})
		).subscribe();

		// get all pages for top list
		this._pagesRepository.pages$
			.pipe(
				untilDestroyed(this),
				tap((pages) => {
					this.pages = [...pages];
					console.log({ pages });

					this._check();
				})
			)
			.subscribe();

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'open-page-editor') {
						this.openPageEditor();
					} else if (event === 'display-other-pages-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	selectPage(pageId: string) {
		this._router.navigate(['/pages', pageId]);
	}

	openPageEditor() {
		this.pageItem?.openObjectPrompt();
	}

	ngOnDestroy(): void {
		this._metaDataService.setRumbleFavicon();
	}
}
