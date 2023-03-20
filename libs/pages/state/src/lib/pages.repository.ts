import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createStore, propsFactory } from '@ngneat/elf';
import {
	addEntities,
	getEntity,
	selectActiveEntities,
	selectActiveEntity,
	selectAllEntities,
	selectAllEntitiesApply,
	selectEntity,
	setActiveId,
	setEntities,
	toggleActiveIds,
	UIEntitiesRef,
	updateEntities,
	upsertEntities,
	withActiveId,
	withActiveIds,
	withEntities,
	withUIEntities,
} from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Collection } from '@rumble-pwa/collections/models';
import { CollectionsRepository } from '@rumble-pwa/collections/state';
import { Domain, DomainsRepository } from '@rumble-pwa/domains/state';
import { EntityFile } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { Form, Subscription } from '@rumble-pwa/mega-store';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { ObjectPromptComponent, ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { RestService } from '@rumble-pwa/requests';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	ElfSyncable,
	prepEntityForCreation,
	prepEntityForRefresh,
	prepEntityForUpdate,
	slugifyKeepStar,
} from '@rumble-pwa/utils';
import { cloneDeep, sortBy } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, map, shareReplay, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const storeName = 'pages';
const storePropsName = 'pageProps';

/**
 * Page
 * @param name?: string;
 * @param description?: string;
 * @param publicTitle?: string;
 * @param kind: string; // will be a value of PAGE_KIND_OPTIONS
 * @param data?: string;
 * @param subscriptionId?: string;
 * @param domainId?: string;
 * @param pattern?: string;
 */
export interface Page extends ElfSyncable {
	name?: string;
	description?: string;
	publicTitle?: string;
	kind: string; // will be a value of PAGE_KIND_OPTIONS
	ownerId?: string;
	/** data contains the target info */
	data?: string;
	subscriptionId?: string;
	domainId?: string;
	pattern?: string;
}

export interface PageData {
	/** [WARNING] favicon URI (can starts with `rs://`) */
	faviconUrl?: string | string[] | null;
	// for form page:
	formData?: {
		formId: string;
		providerId?: string;
	};
	// for collection page
	collectionData?: {
		collectionId: string;
	};
}

const DEFAULT_PAGE_FAVICON = '/assets/favicons/microphone/favicon.ico';
export function getFaviconUriFromPageData(pageData?: PageData): string {
	if (!pageData) return DEFAULT_PAGE_FAVICON;
	const faviconUri: string | undefined = pageData.faviconUrl
		? typeof pageData.faviconUrl === 'string'
			? pageData.faviconUrl
			: pageData.faviconUrl.length > 0
			? pageData.faviconUrl[0]
			: DEFAULT_PAGE_FAVICON
		: DEFAULT_PAGE_FAVICON;
	return faviconUri;
}

export interface PageUI {
	id: Page['id'];
}
export interface PageProps {
	something?: string;
}

export const DEFAULT_FORM_PROPS: PageProps = {
	something: '',
};

export const PAGE_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_FORM_PROPS,
});

@Injectable({ providedIn: 'root' })
export class PagesRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public pages$: Observable<Page[]>;
	private _pagesToSync$: Observable<Page[]>;
	public pageUIs$: Observable<PageUI[]>;
	public activePages$: Observable<Page[]>;
	public activePage$: Observable<Page | undefined>;
	public pageProps$: Observable<PageProps>;
	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	/** Subscriptions are used for prompt opening */
	subscriptions: Subscription[] = [];
	/** Domains are used for prompt opening */
	domains: Domain[] = [];
	/** Forms are used for prompt opening */
	forms: Form[] = [];
	/** Collections are used for prompt opening */
	collections: Collection[] = [];

	/**
	 *
	 * @param _restService
	 * @param _objectPromptService
	 * @param _domainsRepository - Used for prompt opening
	 * @param _subscriptionsManagementService  - Used for prompt opening
	 */
	constructor(
		//
		private _restService: RestService,
		private _objectPromptService: ObjectPromptService,

		private _domainsRepository: DomainsRepository, // to get domains
		private _subscriptionsManagementService: SubscriptionsManagementService, // to get subs
		private _formsManagementService: FormsManagementService, // to get forms
		private _collectionsRepository: CollectionsRepository, // to get collections
		private _usersRepository: UsersRepository, // to get owned form with profile id
		private _notificationsService: NotificationsService,
		private _router: Router,
		private _fileUploadService: FileUploadService, // for favicon selection
		private _filesRepository: FilesRepository
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.pages$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this._pagesToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);
		this.pageUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activePage$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activePages$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.pageProps$ = this._store$$.pipe(PAGE_PROPS_PIPES.selectPageProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		// fetch data each time logged in status change
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.fetchFromServer(true);
			} else {
				this._store$$.reset();
			}
		});

		// build object to sync $
		this._pagesToSync$.pipe(debounceTime(500)).subscribe((pagesToSync) => {
			pagesToSync.forEach((page) => {
				if (page?.operation === 'creation') {
					this._postToServer(page);
				} else if (page?.operation === 'update') this._putToServer(page);
			});
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// get all subscriptions
		this._subscriptionsManagementService
			.getAll$()
			.pipe(
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
				})
			)
			.subscribe();

		// get all domains
		this._domainsRepository.domains$
			.pipe(
				tap((domains) => {
					this.domains = cloneDeep(domains.filter((d) => d.state == 'default'));
				})
			)
			.subscribe();

		// get all owned forms
		combineLatest([this._formsManagementService.forms$$, this._usersRepository.connectedUser$$])
			.pipe(
				tap(([forms, profile]) => {
					this.forms = sortBy(
						forms.filter((form) => form.ownerId === profile?.id).filter((form) => form.state == 'default'),
						['timeUpdate']
					).reverse();
				})
			)
			.subscribe();

		// get all owned collections
		combineLatest([this._collectionsRepository.collections$, this._usersRepository.connectedUser$$])
			.pipe(
				tap(([collections, profile]) => {
					this.collections = sortBy(
						collections
							.filter((collection) => collection.ownerId === profile?.id)
							.filter((collection) => collection.state == 'default'),
						['timeUpdate']
					).reverse();
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(page: Page) {
		return this._restService
			.post<Page>('/pages', page)
			.pipe(
				tap((r) => {
					this._refreshPage(r);
				})
			)
			.subscribe();
	}

	private _putToServer(page: Page) {
		return this._restService
			.put<Page>(`/pages/${page.id}`, page)
			.pipe(
				tap((r) => {
					this._refreshPage(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<Page[]>('/pages')
			.pipe(
				tap((pages) => {
					if (replace) {
						this._store$$.update(upsertEntities(pages));
					} else {
						pages.forEach((domain) => {
							this._refreshPage(domain);
						});
					}
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   ENTITY METHODS                   //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Replace current collection with the provided collection
	 * @param pages
	 */
	public setPages(pages: Page[]) {
		this._store$$.update(setEntities(pages));
	}

	/**
	 * Add a new page to the collection
	 * @param page
	 */
	public addPage(page: Page) {
		const syncablePage = prepEntityForCreation<Page>(page);
		this._store$$.update(addEntities(syncablePage));
	}

	/**
	 * Update an existing page in the collection
	 * @param id
	 * @param pageUpdate (partial)
	 */
	public updatePage(id: Page['id'] | undefined, pageUpdate: Partial<Page>) {
		const idToUse = id ?? pageUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update page without an id');
		}

		const previousPage = this._store$$.query(getEntity(idToUse));
		if (!previousPage) {
			throw new Error(`Page with id ${idToUse} not found`);
		}
		const updatedPage: Page = {
			...previousPage,
			...pageUpdate,
		};
		const syncablePage = prepEntityForUpdate<Page>(updatedPage, previousPage);
		this._store$$.update(updateEntities(idToUse, syncablePage));
	}

	private _refreshPage(page: Page) {
		const previousPage = this._store$$.query(getEntity(page.id));
		if (!previousPage) {
			throw new Error(`Page with id ${page.id} not found`);
		}
		const syncablePage = prepEntityForRefresh<Page>(page, previousPage);
		this._store$$.update(updateEntities(page.id, syncablePage));
	}

	// public deletePage(id: Page['id']) {
	// 	this._store.update(deleteEntities(id));
	// }

	/**
	 * Subscribe to a page
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<Page | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	public setActiveId(id: Page['id']) {
		this._store$$.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<Page['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setPageProps(pageProps: Partial<PageProps>) {
		this._store$$.update(PAGE_PROPS_PIPES.updatePageProps(pageProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Page>(),
			withUIEntities<PageUI>(),
			PAGE_PROPS_PIPES.withPageProps(),
			withActiveId(),
			withActiveIds()
		);

		return store;
	}

	// ---------------------------------------------------//
	//                                                    //
	//                  CUSTOM METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Open the object prompt to edit the page
	 */
	public openObjectPrompt(options?: {
		pageId?: string;
		page?: Partial<Page>;
		modalTitle?: string;
		modalSubmitText?: string;
		target?: string;
	}) {
		const emptyPageData: PageData = {};
		const pageData: PageData = options?.page?.data ? JSON.parse(options.page.data) : emptyPageData;

		// fn to convert a "kind" to a list of options for "target"
		const convertKindToOptions = (kind: string) => {
			if (kind == 'form') {
				return this.forms.map((form) => {
					return { name: form.title ?? '', value: form.id };
				});
			} else if (kind == 'collection') {
				return this.collections.map((collection) => {
					return { name: collection.title, value: collection.id };
				});
			} else {
				return [];
			}
		};

		// fn to update domain and pattern hints
		const updateURLHints = (
			promptComponent: ObjectPromptComponent<ExtendedPage>,
			newPatternValue?: string,
			newDomainId?: string
		) => {
			const domainId: string = newDomainId ?? (promptComponent.attributeForm.value['domainId'] || undefined);
			const patternValue: string = newPatternValue ?? promptComponent.attributeForm.value['pattern'] ?? '/';

			let domainUrl: string | undefined = undefined;
			if (domainId) {
				const domain = this._domainsRepository.get(domainId);

				if (domain) {
					domainUrl = domain.url;
				}
			}

			const patternAttribute = promptComponent.attributes.find((oa) => oa.name == 'pattern');
			const domainAttribute = promptComponent.attributes.find((oa) => oa.name == 'domainId');

			if (patternAttribute && domainUrl) {
				patternAttribute.HTMLhint = 'Full page URL: ' + domainUrl + patternValue;
			} else if (patternAttribute) {
				patternAttribute.HTMLhint =
					'This will be used to complete your domain URL: https://subdomain.yourdomain.com/<this-path>';
			}
			if (domainAttribute && domainUrl) {
				domainAttribute.HTMLhint = 'This page URL will start with: ' + domainUrl;
			} else if (domainAttribute) {
				domainAttribute.HTMLhint = 'Use a domain of yours as a root for this new page.';
			} else {
				console.log('No domain attribute');
			}
			// setTimeout(() => {
			// 	promptComponent._check();
			// }, 200);
		};

		let defaultValueTarget;

		if (options?.page?.kind == 'form') defaultValueTarget = pageData.formData?.formId;
		else if (options?.page?.kind == 'collection') defaultValueTarget = pageData.collectionData?.collectionId;

		type ExtendedPage = Partial<Page> & { target?: string; faviconThumbnails?: ObjectThumbnail<EntityFile>[] };

		const faviconThumbnail = this._filesRepository.convertURIToObjectThumbnail(getFaviconUriFromPageData(pageData));

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedPage>(
				//
				{
					modalTitle: options?.modalTitle ?? 'Edit your page',
					modalDescription:
						'📙 Find the related help article here: <a href="https://help.rumble.studio/hc/how-to-use-your-domain-with-rumble-studio" target="_blank">Use your domain with Rumble</a>',
					modalSubmitText: options?.modalSubmitText ?? 'Save',
					objectId: options?.pageId,
					object: {
						...options?.page,
						faviconThumbnails: faviconThumbnail ? [faviconThumbnail] : [],
					},
					attributes: [
						{
							name: 'kind',
							HTMLlabel: 'Kind',
							defaultValue: 'form',
							required: true,
							attributeType: 'select',
							HTMLhint: 'What kind of page is it? Display an interview, a simple audio drop box...',
							extra: {
								options: [
									{
										value: undefined,
										name: '----',
									},
									{
										value: 'form',
										name: 'Interview page: this URL will display an interview of your choice.',
									},
									{
										// TODO: bug
										value: 'collection',
										name: 'Collection page: this URL will display a collection of your choice.[🔜 ALMOST READY]',
										disabled: true,
									},
									{
										value: 'quick',
										name: 'Simple file drop box page [🔜 not ready yet]',
										disabled: true,
									},
									{
										value: 'team',
										name: 'Team presentation page [🔜 not ready yet]',
										disabled: true,
									},
									{
										value: 'brand',
										name: 'Brand page with logo and associated contents [not ready yet]',
										disabled: true,
									},
									{
										value: 'custom',
										name: 'Build your page with an HTML builder [not ready yet]',
										disabled: true,
									},
									{
										value: 'redirect',
										name: 'Redirect: in case you changed the path of a previous page or wants to A-B test on URLs [🔜 not ready yet]',
										disabled: true,
									},
								],
							},
							callBack: (kind: string, promptComponent: ObjectPromptComponent<ExtendedPage>) => {
								// update target options based on kind of page
								const targetAttribute = promptComponent.attributes.find((oa) => oa.name == 'target');
								if (targetAttribute?.extra) {
									targetAttribute.extra.options = convertKindToOptions(kind);
								}
							},
						},
						{
							name: 'target',
							HTMLlabel: 'Target',
							defaultValue: defaultValueTarget,
							required: true,
							attributeType: 'select',
							extra: { options: options?.page?.kind ? convertKindToOptions(options.page.kind) : [] },
							HTMLhint: 'Choose which element will be display on your page.',
							editCallBack: (targetId: string, promptComponent: ObjectPromptComponent<ExtendedPage>) => {
								const kind: string = promptComponent.attributeForm.value['kind'];
								if (kind === 'form') {
									const form: Form | undefined = this._formsManagementService.get(targetId);
									if (!form) return;

									let newPattern = form.title ? '/' + slugifyKeepStar(form.title) : '/';
									if (newPattern[newPattern.length - 1] == '-') {
										newPattern = newPattern.substring(0, newPattern.length - 1);
									}

									promptComponent.attributeForm.patchValue({
										name: form.title ? '[interview] ' + form.title + '' : '',
										description: form.title
											? 'Visitors will reach this interview: "' + form.title + '"'
											: '',
										pattern: newPattern,
										publicTitle: form.title ?? '',
									});
								} else if (kind === 'collection') {
									const collection: Collection | undefined = this._collectionsRepository.get(targetId);
									if (!collection) return;

									let newPattern = collection.title ? '/' + slugifyKeepStar(collection.title) : '/';
									if (newPattern[newPattern.length - 1] == '-') {
										newPattern = newPattern.substring(0, newPattern.length - 1);
									}

									promptComponent.attributeForm.patchValue({
										name: collection.title ? '[collection] ' + collection.title + '' : '',
										description: collection.title
											? 'Visitors will reach this collection: "' + collection.title + '"'
											: '',
										pattern: newPattern,
										publicTitle: collection.title ?? '',
									});
								}
								return targetId;
							},
						},
						{
							name: 'name',
							HTMLlabel: 'Internal name',
							defaultValue: '',
							required: true,
						},
						{
							name: 'description',
							HTMLlabel: 'Internal description',
							defaultValue: '',
						},
						{
							name: 'domainId',
							HTMLlabel: 'Domain',
							attributeType: 'select',
							required: true,
							HTMLhint: 'truc',
							extra: {
								options: [
									...this.domains.map((domain) => {
										const displayedDomainName = domain.name ?? domain.url ?? domain.id.substring(0, 8);
										const displayedDomainUrl = domain.url ?? 'url not available';
										return {
											name: displayedDomainName + ' (' + displayedDomainUrl + ')',
											value: domain.id,
										};
									}),
									{
										name: 'Create a new domain',
										value: undefined,
										onClick: async (event: Event) => {
											event.preventDefault();
											const r = await this._notificationsService
												.confirm(
													'Go to domain page',
													'This action will close the current form and all your inputs will be lost.',
													'Stay here',
													'Go to domains page'
												)
												.toPromise();
											if (r) {
												this._router.navigateByUrl('/domains');
												return true;
											}
											return false;
										},
									},
								],
							},
							defaultValue: this.domains.find((domain) => domain.id)?.id,
							editCallBack: (domainId: string, promptComponent) => {
								updateURLHints(promptComponent, undefined, domainId);
								return domainId;
							},
						},
						{
							name: 'publicTitle',
							HTMLlabel: 'Public page title',
							defaultValue: '',
							placeholder: 'The Title',
							required: true,
						},
						{
							name: 'pattern',
							HTMLlabel: 'URL Path ("slug")',
							defaultValue: '/',
							required: true,
							HTMLpattern: '/.*',
							editCallBack: (patternValue: string, promptComponent, attribute) => {
								if (patternValue.length == 0) {
									return '/';
								}
								if (patternValue[0] != '/') {
									patternValue = '/' + patternValue;
								}
								const newPatternValue = patternValue
									.split('/')
									.map((s) => slugifyKeepStar(s))
									.join('/');

								updateURLHints(promptComponent, newPatternValue);
								return newPatternValue;
							},
						},
						{
							name: 'faviconThumbnails',
							HTMLlabel: 'Favicon',
							HTMLhint: 'This image will be used as the favicon (small image in the tab)',
							attributeType: 'objectThumbnails',
							defaultValue: [],
							extra: {
								maxObjectsSelected: 1,
								objectList: {
									getNewObjects$: this._fileUploadService.getNewImages$,
									displayDeleteButton: true,
								},
							},
						},
						{
							name: 'subscriptionId',
							HTMLlabel: 'Subscription',
							HTMLhint: 'You must select a subscription to attach this page to.',
							attributeType: 'select',
							required: true,
							extra: {
								options: this.subscriptions.map((subscription) => {
									const displayedSubscriptionName =
										(subscription.name ?? subscription.id.substring(0, 8)) +
										'  ( used pages: ' +
										(subscription.usedPages ?? 0) +
										'/' +
										(subscription.maxAvailablePages ?? 0) +
										' )';

									return {
										name: displayedSubscriptionName,
										value: subscription.id,
										disabled: (subscription.usedPages ?? 0) >= (subscription.maxAvailablePages ?? 0),
									};
								}),
							},
							defaultValue: this.subscriptions.find(
								(subscription) => (subscription.usedPages ?? 0) < (subscription.maxAvailablePages ?? 0)
							)?.id,
						},
					],

					initialCallback: (promptComponent: ObjectPromptComponent<ExtendedPage>) => {
						// prefill options of target based on kind=form
						const targetAttribute = promptComponent.attributes.find((oa) => oa.name == 'target');
						const kind: string = promptComponent.attributeForm.value['kind'];
						if (targetAttribute?.extra) {
							targetAttribute.extra.options = convertKindToOptions(kind);
							if (options?.target) {
								promptComponent.attributeForm.patchValue({
									[targetAttribute.name]: options.target,
								});
							}
						}

						// update URL hints based on domain and pattern
						updateURLHints(promptComponent);
					},
				}
			)
			.pipe(
				map((result: Partial<ExtendedPage> | undefined) => {
					if (!result) return undefined;
					if (!result.kind) return undefined;

					if (result.faviconThumbnails && result.faviconThumbnails.length > 0) {
						// pageData.faviconUrl = result.faviconUrl;
						pageData.faviconUrl = result.faviconThumbnails[0].object?.id
							? 'rs://' + result.faviconThumbnails[0].object.id
							: result.faviconThumbnails[0].imageUrl;
					}

					if (result.target) {
						if (result.kind == 'form') {
							pageData.formData = {
								formId: result.target,
								providerId: 'default-participant',
							};
						} else if (result.kind == 'collection') {
							pageData.collectionData = {
								collectionId: result.target,
							};
						}
					}

					if (options?.page?.id) {
						const previousPageId = options.page.id;
						const updatedPage: Page = {
							id: previousPageId,
							...options.page,
							name: result.name ?? options.page.name,
							description: result.description,
							publicTitle: result.publicTitle,
							kind: result.kind,
							data: JSON.stringify(pageData),
							subscriptionId: result.subscriptionId,
							pattern: result.pattern,
							domainId: result.domainId,
						};
						this.updatePage(options.page.id, updatedPage);
						return updatedPage;
					} else {
						const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
						if (!ownerId) return undefined;
						const newPage: Page = {
							id: options?.pageId ?? uuidv4(),
							name: result.name ?? 'Untitled page',
							description: result.description,
							publicTitle: result.publicTitle,
							kind: result.kind,
							data: JSON.stringify(pageData),
							subscriptionId: result.subscriptionId,
							pattern: result.pattern,
							domainId: result.domainId,
						};
						this.addPage(newPage);
						return newPage;
					}
				})
			);
	}
}
