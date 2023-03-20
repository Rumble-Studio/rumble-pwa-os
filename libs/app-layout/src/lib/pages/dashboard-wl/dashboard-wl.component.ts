import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MetaDataService } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Collection } from '@rumble-pwa/collections/models';
import { CollectionsRepository } from '@rumble-pwa/collections/state';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FormOpenerData } from '@rumble-pwa/forms-layout';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { ItemsRepository } from '@rumble-pwa/items/state';
import { DEFAULT_LAYOUT_PROPS, LayoutProps, LayoutRepository } from '@rumble-pwa/layout/state';
import { Form, FormData } from '@rumble-pwa/mega-store';
import { getFaviconUriFromPageData, Page, PageData } from '@rumble-pwa/pages/state';
import { RestService } from '@rumble-pwa/requests';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, DataObsViaId, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import minimatch from 'minimatch';
import { of } from 'rxjs';
import { catchError, debounceTime, filter, switchMap, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-dashboard-wl',
	templateUrl: './dashboard-wl.component.html',
	styleUrls: ['./dashboard-wl.component.scss'],
})
export class DashboardWlComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	public layoutProps: LayoutProps = DEFAULT_LAYOUT_PROPS;

	page?: Page;
	pageData?: PageData;
	pageFetched = false;

	// ------------------------------------//
	//                                     //
	//           INTERVIEW KIND            //
	//	Needed properties when page is of  //
	//	Interview Kind.     		       //
	//-------------------------------------//

	providerId = 'default-participant';
	isOffline = false;
	form$$$ = new DataObsViaId<Form>((formId: string) => this._formsManagementService.get$(formId));
	profile: User | null = null;
	formIsLoading = true;
	stepId?: string;
	formDataWasFetched = false;
	previewMode = false;

	// ------- end interview kind ----------//

	// ------------------------------------//
	//                                     //
	//          COLLECTION KIND            //
	//	Needed properties when page is of  //
	//	Collection Kind.     		       //
	//-------------------------------------//

	collection$$$ = new DataObsViaId<Collection>((collectionId: string) => this._collectionsRepository.get$(collectionId));
	collectionDataWasFetched = false;
	collectionIsLoading = true;

	// ------ end collection kind ---------//

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _restService: RestService,
		private _formsManagementService: FormsManagementService,
		private _collectionsRepository: CollectionsRepository,
		private _itemsRepository: ItemsRepository,
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _router: Router,
		public layoutRepository: LayoutRepository,
		private _metaDataService: MetaDataService,
		private _filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		let url: string | undefined = undefined;

		// layout repository
		this.layoutRepository.layoutProps$
			.pipe(
				untilDestroyed(this),
				debounceTime(50),
				tap((props) => {
					this.layoutProps = props;
					console.log('Layout props updated', this.layoutProps.url);
					this._check();
				}),
				filter((props) => url != props.url),
				tap((props) => {
					url = props.url;
				}),
				switchMap(() => this._restService.post<Page[]>('/pages/list/origin', window.location.origin)),
				tap((pages) => {
					if (url)
						this.page = pages.find((page) => {
							if (page.state === 'deleted' || page.state === 'archived') return false;
							if (url && page.pattern)
								return minimatch(url.split('?')[0], page.pattern, {
									nocase: true,
									debug: false,
								});
							return false;
						});
					if (this.page && this.page.data) {
						console.log({ page: this.page });
						const pageData: PageData = this.page.data ? JSON.parse(this.page.data) : {};
						this.pageData = pageData;
						if (pageData.formData) {
							this.handleInterviewPage({
								formId: pageData.formData.formId,
								providerId: pageData.formData.providerId,
							});
						}
						if (pageData.collectionData) {
							this.handleCollectionPage(pageData.collectionData.collectionId);
						}
					} else {
						console.warn('No page available for this url', { url, page: this.page });
					}
					this.pageFetched = true;
					this._updateMetaData();
					this._check();
				})
			)
			.subscribe();
	}

	handleInterviewPage(data: FormOpenerData) {
		this.form$$$.id = data.formId;
		this.providerId = data.providerId ?? this.providerId;
		this.previewMode = data.previewMode ?? this.previewMode;
		this.stepId = data.stepId;

		this.form$$$.id$$
			.pipe(
				untilDestroyed(this),
				filter((formId) => !!formId),
				switchMap((formId: string | undefined) => {
					if (formId && !this.formDataWasFetched) {
						this.formIsLoading = true;
						this.formDataWasFetched = true;
						return this._formsManagementService.fetchFormData$(formId);
					} else {
						this.formIsLoading = false;
						return of(undefined);
					}
				}),
				tap(() => {
					this.formIsLoading = false;
					this._check();
				}),
				catchError((error) => {
					console.error('error', error);

					this._notificationsService.error('Interview not found.', 'Error');
					this.formIsLoading = false;
					return of(undefined);
				})
			)
			.subscribe();

		this.form$$$.$.pipe(
			untilDestroyed(this),
			tap((form: Form | undefined) => {
				if (form) {
					const data: FormData = form.data ? JSON.parse(form.data) : {};
					this.isOffline = data.isOffline ?? false;
					if (this.isOffline) {
						this._notificationsService.info('This interview is not available right now.', 'Offline');
					}
				}
			})
		).subscribe();

		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((profile) => {
					this.profile = profile;
				})
			)
			.subscribe();
	}

	handleCollectionPage(collectionId: string) {
		this.collection$$$.id = collectionId;

		this.collection$$$.id$$
			.pipe(
				untilDestroyed(this),
				filter((collectionId) => !!collectionId),
				switchMap((collectionId: string | undefined) => {
					if (collectionId && !this.collectionDataWasFetched) {
						this.collectionIsLoading = true;
						this.collectionDataWasFetched = true;
						return this._collectionsRepository.fetchCollectionData$(collectionId);
					} else {
						this.collectionIsLoading = false;
						return of(undefined);
					}
				}),
				tap((result) => {
					if (result?.items) {
						result.items.forEach((item) => {
							this._itemsRepository.upsertItem({ ...item, operation: 'refresh' });
						});
					}
					this.collectionIsLoading = false;
					this._check();
				}),
				catchError((error) => {
					console.error('error', error);

					this._notificationsService.error('Collection not found.', 'Error');
					this.collectionIsLoading = false;
					return of(undefined);
				})
			)
			.subscribe();

		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((profile) => {
					this.profile = profile;
				})
			)
			.subscribe();
	}

	/**
	 * Set title and emit new fav icon url if provided
	 */
	private _updateMetaData() {
		console.warn('update meta data not implemented');

		if (this.page?.publicTitle) this._metaDataService.setTitle(this.page.publicTitle);
		// Subcribe to page$$$ to fil lthe favicon thumbnail

		const defaultPageData: PageData = {};
		const pageData = this.page?.data ? JSON.parse(this.page.data) : defaultPageData;
		const faviconUri = getFaviconUriFromPageData(pageData);
		console.log('faviconUri:', faviconUri);

		this._filesRepository
			.convertURIToObjectThumbnail$(faviconUri)
			.pipe(
				untilDestroyed(this),
				filter((faviconThumbnail) => !!faviconThumbnail?.imageUrl),
				take(1),
				tap((faviconThumbnail) => {
					if (faviconThumbnail?.imageUrl) this._metaDataService.setFavicon(faviconThumbnail.imageUrl);
				})
			)
			.subscribe();
	}
}
