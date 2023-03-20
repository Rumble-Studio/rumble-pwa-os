import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DownloaderComponent, ImageComponent, PillComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Domain, DomainsRepository } from '@rumble-pwa/domains/state';
import { EntityFile } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Subscription } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { getFaviconUriFromPageData, Page, PageData, PagesRepository } from '@rumble-pwa/pages/state';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { CanBeDebugged, CanCheck, DataObsViaId, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'rumble-pwa-page-item',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualPlaylistComponent,
		DownloaderComponent,
		RouterModule,
		MatIconModule,
		MatButtonModule,
		PillComponent,
		ImageComponent,
		TrackClickDirective,
	],
	templateUrl: './page-item.component.html',
	styleUrls: ['./page-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageItemComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	page$$$ = new DataObsViaId<Page>((pageId: string) => this._pagesRepository.get$(pageId));
	public get pageId() {
		return this.page$$$.id;
	}
	@Input()
	public set pageId(newObjectId) {
		this.page$$$.id = newObjectId;
	}

	domain$$$ = new DataObsViaId<Domain>((domainId: string) => this._domainsRepository.get$(domainId));
	public get domainId() {
		return this.domain$$$.id;
	}
	public set domainId(newObjectId) {
		this.domain$$$.id = newObjectId;
	}

	pageData?: PageData;
	subscriptions: Subscription[] = [];

	public faviconThumbnail: ObjectThumbnail<EntityFile> | undefined = undefined;

	fullUrl: string | undefined = undefined;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _pagesRepository: PagesRepository,
		private _domainsRepository: DomainsRepository,
		private _subscriptionsManagementService: SubscriptionsManagementService,
		private _filesRepository: FilesRepository,
		private _notificationsService: NotificationsService,
		private _fileUploadService: FileUploadService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.page$$$.$.pipe(
			untilDestroyed(this),
			tap((page) => {
				this.domainId = page?.domainId;
				const defaultPageData: PageData = {};
				this.pageData = page?.data ? JSON.parse(page.data) : defaultPageData;
				this._check();
			})
		).subscribe();

		// Subcribe to page$$$ to fil lthe favicon thumbnail
		this.page$$$.$.pipe(
			untilDestroyed(this),
			map((page) => {
				const defaultPageData: PageData = {};
				this.pageData = page?.data ? JSON.parse(page.data) : defaultPageData;
				const faviconUri = getFaviconUriFromPageData(this.pageData);
				return faviconUri;
			}),
			switchMap((faviconUri) => this._filesRepository.convertURIToObjectThumbnail$(faviconUri)),
			tap((faviconThumbnail) => {
				this.faviconThumbnail = faviconThumbnail;
				this._check();
			})
		).subscribe();

		this.domain$$$.$.pipe(
			untilDestroyed(this),
			tap(() => this._check())
		).subscribe();
		combineLatest([this.domain$$$.$, this.page$$$.$])
			.pipe(
				tap(([domain, page]) => {
					if (domain?.url && page?.pattern) {
						this.fullUrl = domain.url + page.pattern;
						this._check();
					}
				})
			)
			.subscribe();

		// get all subscriptions
		this._subscriptionsManagementService
			.getAll$()
			.pipe(
				untilDestroyed(this),
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
					this._check();
				})
			)
			.subscribe();
	}

	// updateFavicon(imageUrl?: string) {
	// 	const updatedPageData: PageData = { ...this.pageData, faviconUrl: imageUrl };
	// 	this._pagesRepository.updatePage(this.pageId, { data: JSON.stringify(updatedPageData) });
	// }

	public removeFavicon() {
		this._notificationsService
			.confirm('Remove favicon', 'Are you sure to remove your page favicon?', 'Cancel', 'Remove')
			.subscribe((confirm) => {
				if (confirm) {
					const updatedPageData: PageData = { ...this.pageData, faviconUrl: null };
					this._pagesRepository.updatePage(this.pageId, { data: JSON.stringify(updatedPageData) });
				}
			});
	}
	public updateFavicon() {
		this._fileUploadService
			.getNewImages$(1)
			.pipe(
				untilDestroyed(this),
				tap((r) => {
					console.log(r);
					if (r && r.length > 0) {
						const imageEntityFile = r[0].object;
						if (imageEntityFile) {
							const updatedPageData: PageData = { ...this.pageData, faviconUrl: 'rs://' + imageEntityFile.id };
							this._pagesRepository.updatePage(this.pageId, { data: JSON.stringify(updatedPageData) });
						}
					}
				})
			)
			.subscribe();
	}

	openObjectPrompt() {
		const page = this.page$$$.value;
		if (!page) return;

		this._pagesRepository.openObjectPrompt({ pageId: page.id, page: page }).pipe(untilDestroyed(this)).subscribe();
	}
}
