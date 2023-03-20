import { Injectable } from '@angular/core';
import { createStore, propsFactory } from '@ngneat/elf';
import {
	addEntities,
	getAllEntities,
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
import { FileTableComponent, FileWithOwner } from '@rumble-pwa/files/display';
import { EntityFile } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { FormCustomisationDetails, Grant, Group, Subscription } from '@rumble-pwa/mega-store';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { ObjectAttribute, ObjectPromptComponent, ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { FilePlayerComponent } from '@rumble-pwa/player/specialised';
import { RestService } from '@rumble-pwa/requests';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	Bs$$,
	ElfSyncable,
	prepEntityForCreation,
	prepEntityForRefresh,
	prepEntityForUpdate,
	VisionService,
} from '@rumble-pwa/utils';
import { sortBy, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { catchError, debounceTime, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { AudioPack, AudioPackItem } from './audio-pack.model';

const storeName = 'brands';
const storePropsName = 'brandProps';

export interface Brand extends ElfSyncable {
	id: string;
	ownerId: string;
	name: string;
	domain?: string;
	description?: string;
	colors?: string;
	data?: string;
	/** [WARNING] Logo URI (can start with `rs://`) */
	logo?: string;
	subscriptionId?: string;
}

export function convertBrandToBrandColors(brand?: { colors?: string }) {
	return brand?.colors?.split(';').filter((c: string) => !!c) ?? [];
}
export function convertColorListToBrandColors(colors?: string[]) {
	return colors ? colors.join(';') : '';
}

export interface BrandData {
	// for form brand:
	/** [WARNING] images URI: can all start with `rs://` */
	images?: string[];
	fonts?: string[];
	audioPacks?: AudioPack[];
	sharedWith?: string[];
	formCustomisations?: { [key: string]: FormCustomisationDetails };
}

export interface BrandUI {
	id: Brand['id'];
}
export interface BrandProps {
	something?: string;
}

export const DEFAULT_BRAND_PROPS: BrandProps = {
	something: '',
};

export const BRAND_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_BRAND_PROPS,
});

// CUSTOM INTERFACE AND CONST
export interface ScrappingState {
	domain: string | undefined;
	scrappingServerReponse: ScrappingServerResponse | undefined;
	state: 'aborted' | 'canceled' | 'requesting' | 'requested' | undefined;
}

export interface ScrappingServerResponse {
	title?: string;
	description?: string;
	images?: string[] | null;
	adult?: boolean;
	domain?: string;
}

const DOMAINS_TO_IGNORE: (string | undefined)[] = [
	'gmail.com',
	'yahoo.com',
	'hotmail.com',
	'yopmail.com',
	'yahoo.fr',
	'msn.com',
	'email.com',
];

@Injectable({ providedIn: 'root' })
export class BrandsRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public brands$: Observable<Brand[]>;
	private _brandsToSync$: Observable<Brand[]>;
	public brandUIs$: Observable<BrandUI[]>;
	public activeBrands$: Observable<Brand[]>;
	public activeBrand$: Observable<Brand | undefined>;
	public brandProps$: Observable<BrandProps>;
	public maxBrandingKitsReached$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	/** Subscriptions are used for prompt opening */
	subscriptions: Subscription[] = [];
	/** Domain Regex for validators */
	domainRegex = '^https://?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';
	/** Groups are used for prompt opening to share brands */
	private _groupsForSharing?: Group[];
	/** Brands where ownerId is logged-in user id (including deleted and archived) */
	public ownedBrands$: Observable<Brand[]>;
	/** Brands coming from a group (team/folder) or subfolders => used for display in pages (including deleted and archived) */
	public sharedBrands$: Observable<Brand[]>;
	/** Accessible brands */
	public accessibleBrands$: Observable<Brand[]>;

	private _maxImagesToScrap = 21; // takes 20 first images (used in _applyValuesInForm)

	private _domainToScrap$$$ = new Bs$$<string>(); // to get the website and make the request

	/**
	 * domain = the domain to scrape
	 * result = the ScrapServerResponse
	 * state = the state of the request
	 */
	private _scrappingResult$$ = new BehaviorSubject<ScrappingState>({
		domain: undefined,
		scrappingServerReponse: undefined,
		state: undefined,
	});

	/**
	 *
	 * @param _restService
	 * @param _objectPromptService
	 * @param _subscriptionsManagementService  - Used for prompt opening
	 */
	constructor(
		//
		private _restService: RestService,
		private _objectPromptService: ObjectPromptService,

		private _subscriptionsManagementService: SubscriptionsManagementService, // to get subs to get limit branding kit
		private _groupsManagementService: GroupsManagementService, // for shared brands
		private _usersRepository: UsersRepository,

		private _notificationsService: NotificationsService,

		private _visionService: VisionService,
		private _filesRepository: FilesRepository,
		private _fileUploadService: FileUploadService
	) {
		// console.log('%c[BrandsRepository](constructor)', 'color: #00a7e1; font-weight: bold');

		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.brands$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.brandUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeBrand$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeBrands$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.brandProps$ = this._store$$.pipe(BRAND_PROPS_PIPES.selectBrandProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		// fetch data or clear data based on logged in status
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.fetchFromServer(true);
			} else {
				console.log('%c[brandsRepository](constructor)', 'color:red', 'Clearing store');

				this._store$$.reset();
			}
		});

		this._brandsToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);

		// build object to sync $
		this._brandsToSync$.pipe(debounceTime(500)).subscribe((brandsToSync) => {
			brandsToSync.forEach((brand) => {
				if (brand?.operation === 'creation') {
					this._postToServer(brand);
				} else if (brand?.operation === 'update') this._putToServer(brand);
			});
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// request scrap result to backend
		this._domainToScrap$$$.$.pipe(
			debounceTime(1000),
			switchMap((domain) => {
				// concert domain to scrapping status
				if (!domain) {
					const scrappingResult: ScrappingState = {
						domain: undefined,
						scrappingServerReponse: undefined,
						state: 'aborted',
					};
					return of(scrappingResult);
				} else if (
					this._scrappingResult$$.value.domain === domain &&
					this._scrappingResult$$.value.state === 'requested'
				) {
					// result already available
					return of(this._scrappingResult$$.value);
				} else if (
					this._scrappingResult$$.value.domain === domain &&
					this._scrappingResult$$.value.state === 'requesting'
				) {
					// request already sent
					const scrappingResult: ScrappingState = {
						domain,
						scrappingServerReponse: undefined,
						state: 'requesting',
					};
					return of(scrappingResult);
				} else {
					// needs to do request
					const scrappingResult: ScrappingState = {
						domain,
						scrappingServerReponse: undefined,
						state: 'requesting',
					};
					return of(scrappingResult);
				}
			}),
			filter((scrappingServerResult: ScrappingState) => {
				if (
					this._scrappingResult$$.value?.state === 'requesting' &&
					this._scrappingResult$$.value.domain === scrappingServerResult.domain
				) {
					// already requesting
					return false;
				}
				return true;
			}),
			switchMap((scrappingServerResult: ScrappingState) => {
				if (scrappingServerResult.state === 'requesting') {
					// doing request
					this._scrappingResult$$.next({
						scrappingServerReponse: undefined,
						state: 'requesting',
						domain: scrappingServerResult.domain,
					});
					return this._scrapDomain(scrappingServerResult);
				} else {
					//not doing request
					return of(scrappingServerResult);
				}
			}),
			tap((scrappingState: ScrappingState) => {
				this._scrappingResult$$.next(scrappingState);
			})
		).subscribe();

		// todo: test if missing
		// // launch a scrap request if the user domain branding kit is not yet created
		// this._usersRepository.connectedUser$$
		// 	.pipe(
		// 		filter((profile) => !!profile?.email),
		// 		take(1),
		// 		map((profile) => profile?.email as string),
		// 		tap((email) => {
		// 			console.log(email);
		// 			let defaultDomain: string | undefined = email.split('@')[1];
		// 			if (DOMAINS_TO_IGNORE.includes(defaultDomain)) defaultDomain = undefined;
		// 			if (defaultDomain) {
		// 				defaultDomain = 'https://' + defaultDomain;
		// 				console.log('Prerequesting scrap for this domain:', defaultDomain);

		// 				this._domainToScrap$$$.$$.next(defaultDomain);
		// 			}
		// 		})
		// 	)
		// 	.subscribe();

		// get all subscriptions for max brand limit
		this._subscriptionsManagementService
			.getAll$()
			.pipe(
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
				})
			)
			.subscribe();

		// get all groups for sharing option in prompt editor
		this._groupsManagementService
			.getAll$()
			.pipe(
				tap((groups) => {
					this._groupsForSharing = [
						...groups.filter((g) => ['team', 'folder'].includes(g.kind) && g.state === 'default'),
					];
				})
			)
			.subscribe();

		// brand that are owned by the connected user
		this.ownedBrands$ = combineLatest([this.brands$, this._usersRepository.connectedUser$$]).pipe(
			map(([brands, profile]) => brands.filter((brand) => brand.ownerId === profile?.id))
		);

		// use groups and profile to find brands shared with logged-in user
		this.sharedBrands$ = combineLatest([
			this._groupsManagementService.groups$$,
			this._usersRepository.connectedUser$$,
		]).pipe(
			switchMap(([groups, profile]) => {
				const sharedBrands$: Observable<Brand | undefined>[] = [];
				if (profile) {
					const brandIds: string[] = [];
					groups.forEach((group) => {
						const grants: Grant[] = this._groupsManagementService.fillChildrenRecursively(group.id)?.grants ?? [];
						grants.forEach((grant) => {
							const parameters = JSON.parse(grant.parameters || '{}');
							if (!parameters.brandId) return;
							const brandId = parameters.brandId;
							const brand$: Observable<Brand | undefined> = this.get$(brandId);
							if (brandIds.includes(brandId)) return;
							brandIds.push(brandId);
							sharedBrands$.push(brand$);
						});
					});
				}
				return combineLatest(sharedBrands$);
			}),
			map((sharedBrands) => sharedBrands.filter((sharedBrand): sharedBrand is Brand => !!sharedBrand)),
			startWith([])
		);

		// get accessible brands (owned and shared)
		this.accessibleBrands$ = combineLatest([this.ownedBrands$, this.sharedBrands$]).pipe(
			map(([ownedBrands, sharedBrands]) => {
				return sortBy(uniq([...ownedBrands, ...sharedBrands]), ['timeUpdate', 'timeCreation']).reverse();
			}),
			startWith([])
		);

		// check if branding kits limit is reached
		this._subscriptionsManagementService.subscriptions$$
			.pipe(
				tap((subscriptions) => {
					const numberOfBrandingKitsCreated = subscriptions
						.map((sub) => sub.usedBrandingKits ?? 0)
						.reduce((sum, current) => {
							return sum + current;
						}, 0);
					const maxBrandingKitsAllowed = subscriptions
						.map((sub) => sub.maxAvailableBrandingKits ?? 0)
						.reduce((sum, current) => {
							return sum + current;
						}, 0);
					this.maxBrandingKitsReached$$.next(numberOfBrandingKitsCreated >= maxBrandingKitsAllowed);
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(brand: Brand) {
		return this._restService
			.post<Brand>('/brands', brand)
			.pipe(
				tap((r) => {
					this._refreshBrand(r);
				})
			)
			.subscribe();
	}

	private _putToServer(brand: Brand) {
		return this._restService
			.put<Brand>(`/brands/${brand.id}`, brand)
			.pipe(
				tap((r) => {
					this._refreshBrand(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<Brand[]>('/brands')
			.pipe(
				tap((brands) => {
					if (brands.length === 0) {
						this._insertExampleBrand();
						this._insertRumbleBrand();
					} else if (replace) {
						this._store$$.update(upsertEntities(brands));
					} else {
						brands.forEach((brand) => {
							this._refreshBrand(brand);
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
	 * @param brands
	 */
	public setBrands(brands: Brand[]) {
		this._store$$.update(setEntities(brands));
	}

	/**
	 * Add a new brand to the collection
	 * @param brand
	 */
	public addBrand(brand: Brand) {
		const syncableBrand = prepEntityForCreation<Brand>(brand);
		this._store$$.update(addEntities(syncableBrand));
	}

	/**
	 * Update an existing brand in the collection
	 * @param id
	 * @param brandUpdate (partial)
	 */
	public updateBrand(id: Brand['id'] | undefined, brandUpdate: Partial<Brand>) {
		const idToUse = id ?? brandUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update brand without an id');
		}

		const previousBrand = this._store$$.query(getEntity(idToUse));
		if (!previousBrand) {
			throw new Error(`Brand with id ${idToUse} not found`);
		}
		const updatedBrand: Brand = {
			...previousBrand,
			...brandUpdate,
		};
		const syncableBrand = prepEntityForUpdate<Brand>(updatedBrand, previousBrand);
		this._store$$.update(updateEntities(idToUse, syncableBrand));
	}

	private _refreshBrand(brand: Brand) {
		const previousBrand = this._store$$.query(getEntity(brand.id));
		const syncableBrand = prepEntityForRefresh<Brand>(brand, previousBrand);
		this._store$$.update(upsertEntities([syncableBrand]));
	}

	/**
	 * Subscribe to a brand
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<Brand | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string): Brand | undefined {
		return this._store$$.query(getEntity(id));
	}

	public getAll(): Brand[] {
		return this._store$$.query(getAllEntities());
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	public setActiveId(id: Brand['id']) {
		this._store$$.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<Brand['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setBrandProps(brandProps: Partial<BrandProps>) {
		this._store$$.update(BRAND_PROPS_PIPES.updateBrandProps(brandProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Brand>(),
			withUIEntities<BrandUI>(),
			BRAND_PROPS_PIPES.withBrandProps(),
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

	private _insertRumbleBrand() {
		const userId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!userId) return;
		const data: BrandData = {
			images: ['/assets/yellow-transparent.png', '/assets/white-transparant-text-line.png'],
			fonts: ['Roboto'],
			audioPacks: [],
		};
		const defaultBrand: Brand = {
			id: 'default-0-' + userId,
			ownerId: userId,
			name: 'Rumble Studio',
			domain: 'https://rumble.studio',
			description: 'Rumble Studio is a company dedicated to audio content creation.',
			colors: '#f5ca1b;#000000',
			logo: '/assets/yellow-transparent.png',
			data: JSON.stringify(data),
		};
		this.addBrand(defaultBrand);
	}

	private _insertExampleBrand() {
		const userId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!userId) return;
		const data: BrandData = {
			images: ['/assets/farm-logo.webp', '/assets/funny-chicken-1.webp'],
			fonts: [],
			audioPacks: [],
		};
		const defaultBrand: Brand = {
			id: 'default-1-' + userId,
			ownerId: userId,
			name: 'The Example Podcast ',
			domain: 'https://theuselessweb.com/',
			description: 'A good example company doing certainly amazing things.',
			colors: '#0057b7;#ffd700',
			logo: '/assets/farm-logo.webp',
			data: JSON.stringify(data),
		};
		this.addBrand(defaultBrand);
	}

	/**
	 * Loop on each fields asks for confirmation to erase (if not images) if needed then applies the value concerned field
	 * @param scrappingResult : ScrapServerResponse, data that we want in the prompt
	 * @param promptComponent : target compo that we want to feed
	 */
	private _applyValuesInForm<T>(scrappingResult: ScrappingServerResponse, promptComponent: ObjectPromptComponent<T>) {
		if (scrappingResult.images && scrappingResult.images.length > 0) {
			this._notificationsService
				.confirm(
					'Add ' + scrappingResult.images.length + ' images?',
					'We found ' +
						scrappingResult.images.length +
						' images on the website. Do you want to add them on top of the existing images?'
				)
				.subscribe((confimation) => {
					if (confimation) {
						const newImages = scrappingResult.images?.slice(0, this._maxImagesToScrap) ?? [];
						const currentImages = promptComponent.attributeForm.value['images'] ?? [];
						const allImages = uniq([...newImages, ...currentImages]);
						console.log({ allImages });

						promptComponent.attributeForm.patchValue({
							images: allImages,
						});
						promptComponent._check();
					}
				});
		}

		const currentName = promptComponent.attributeForm.value['name'];
		const newName = scrappingResult.title;
		if (!currentName && newName) {
			// fill name if none
			promptComponent.attributeForm.patchValue({
				name: newName,
			});
		} else if (currentName && newName && currentName != newName) {
			// fill name if different (with confirmation)
			this._notificationsService
				.confirm('Replace "' + currentName + '" with "' + newName + '"?')
				.subscribe((confimation) => {
					if (confimation) {
						promptComponent.attributeForm.patchValue({
							name: newName,
						});
					}
				});
		}

		const currentDescription = promptComponent.attributeForm.value['description'];
		const newDescription = scrappingResult.description;
		if (!currentDescription && newDescription) {
			// fill name if none
			promptComponent.attributeForm.patchValue({
				description: newDescription,
			});
		} else if (currentDescription && newDescription && currentDescription != newDescription) {
			// fill name if different (with confirmation)
			this._notificationsService
				.confirm('Replace "' + currentDescription + '" with "' + newDescription + '"?')
				.subscribe((confimation) => {
					if (confimation) {
						promptComponent.attributeForm.patchValue({
							description: newDescription,
						});
					}
				});
		}
	}

	/**
	 * Open the object prompt to edit the brand
	 */
	public openPromptEditor(options?: {
		brandId?: string;
		brand?: Brand;
		modalTitle?: string;
		modalSubmitText?: string;
		canEditSharedGroups?: boolean;
	}): Observable<Brand | undefined> {
		type ExtendedBrand = Partial<Brand> & {
			/** accept URLs (not URIs like `rs://`) */
			images?: ObjectThumbnail<EntityFile>[];
			groups?: string[];
			brandColors?: string[];
			scrapWebsite?: undefined;
			cancelScrapping?: undefined;
		};

		const emptyBrandData: BrandData = {};
		const brandData: BrandData = options?.brand?.data ? JSON.parse(options.brand.data) : emptyBrandData;
		let defaultDomain = this._usersRepository.connectedUser$$.value?.email.split('@')[1];

		const brandColors = convertBrandToBrandColors(options?.brand);

		if (DOMAINS_TO_IGNORE.includes(defaultDomain)) defaultDomain = undefined;
		defaultDomain = defaultDomain ? 'https://' + defaultDomain : 'https://';
		this._domainToScrap$$$.$$.next(defaultDomain);

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedBrand>({
				modalTitle: options?.modalTitle ?? 'Edit your brand',
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.brandId,
				object: {
					...options?.brand,
					images: brandData.images
						?.map((imageUrl) => this._filesRepository.convertURIToObjectThumbnail(imageUrl))
						.filter((imageThumbnail): imageThumbnail is ObjectThumbnail<EntityFile> => !!imageThumbnail),
					brandColors,
					groups: brandData.sharedWith,
				},
				attributes: [
					{
						name: 'name',
						HTMLlabel: 'Name',
						defaultValue: '',
						required: true,
					},
					{
						name: 'description',
						HTMLlabel: 'Description',
						defaultValue: '',
					},
					{
						name: 'domain',
						HTMLlabel: 'Website',
						defaultValue: defaultDomain,
						placeholder: 'https://my-company.com',
						HTMLInputSubtype: 'url',
						HTMLpattern: 'https://.*',
						editCallBack: (value: string) => {
							let result;
							// nothing if already starts with https
							if (value.substring(0, 8) == 'https://') result = value.toLowerCase();

							// replace with https if shorter/equal length but incorrect
							if (value.length <= 7 && value !== 'https://') {
								result = 'https://';
							}

							// replace http with https
							if (value.substring(0, 7) == 'http://') result = 'https://' + value.substring(7).toLowerCase();

							// whatever: let the user do the job
							result = value.toLowerCase();
							this._domainToScrap$$$.$$.next(result);

							return result;
						},
						callBack: (_, promptComponent) => {
							const scrapAttribute = promptComponent.attributes.find((oa) => oa.name == 'scrapWebsite');
							const domain = promptComponent.attributeForm.value['domain'];

							if (scrapAttribute && domain) {
								scrapAttribute.HTMLlabel = 'Fill info automatically from ' + domain + '.';
							}
						},
					},
					// {
					// 	name: 'scrapWebsite',
					// 	HTMLlabel:
					// 		'Fill info automatically from ' + (defaultDomain === 'https://' ? 'your website' : defaultDomain),
					// 	attributeType: 'button',
					// 	HTMLInputSubtype: 'button',
					// 	spinner: { active: false, size: 50 },
					// 	explanation:
					// 		'We will automatically get information from your website (like title, images, descriptions...).',
					// 	callBack: (_, promptComponent) => {
					// 		const scrapAttribute = promptComponent.attributes.find((oa) => oa.name == 'scrapWebsite');
					// 		const cancelScrapAttribute = promptComponent.attributes.find((oa) => oa.name == 'cancelScrapping');
					// 		const domain = promptComponent.attributeForm.value['domain'];
					// 		if (scrapAttribute?.spinner) {
					// 			scrapAttribute.spinner.active = true;
					// 			scrapAttribute.hidden = true;
					// 		}
					// 		if (cancelScrapAttribute) {
					// 			cancelScrapAttribute.hidden = false;
					// 		}
					// 		this._domainToScrap$$$.$$.next(domain);
					// 		this._scrappingResult$$
					// 			.pipe(
					// 				debounceTime(300),
					// 				filter((r) => (r.state === 'requested' && r.domain === domain) || r.state === 'canceled'),
					// 				take(1),
					// 				map((r) => r.scrappingServerReponse),
					// 				switchMap((r) => {
					// 					return from(this._visionService.areImagesSmall$(r?.images ?? [])).pipe(
					// 						map((imagesAreSmall) => {
					// 							const notSmallImages = r?.images?.filter(
					// 								(image, index) => imagesAreSmall[index] === false
					// 							);
					// 							return { r, notSmallImages };
					// 						})
					// 					);
					// 				}),
					// 				tap((scrappingResult) => {
					// 					if (scrappingResult.r?.images) {
					// 						scrappingResult.r.images = scrappingResult.notSmallImages;
					// 					}
					// 					// if the response if fully empty or adult is tagged as true: notifies user
					// 					if (
					// 						scrappingResult.r?.adult === true ||
					// 						(scrappingResult.r?.description === '' &&
					// 							scrappingResult.r?.title === '' &&
					// 							scrappingResult.r?.images === null)
					// 					) {
					// 						this._notificationsService.info(
					// 							'Scrapping unavailable for ' + scrappingResult.r?.domain
					// 						);
					// 					} else if (scrappingResult.r) {
					// 						this._applyValuesInForm<ExtendedBrand>(scrappingResult.r, promptComponent);
					// 					}

					// 					if (cancelScrapAttribute) {
					// 						cancelScrapAttribute.hidden = true;
					// 					}
					// 					if (scrapAttribute?.spinner) {
					// 						scrapAttribute.spinner.active = false;
					// 						scrapAttribute.hidden = false;
					// 					}
					// 					promptComponent._check();
					// 				})
					// 			)
					// 			.subscribe();
					// 	},
					// },
					{
						name: 'cancelScrapping',
						HTMLlabel: 'Cancel',
						attributeType: 'button',
						hidden: true,
						HTMLInputSubtype: 'button',
						callBack: (value, promptComponent) => {
							const cancelScrapAttribute = promptComponent.attributes.find((oa) => oa.name == 'cancelScrapping');
							this._scrappingResult$$.next({ ...this._scrappingResult$$.value, state: 'canceled' });
							if (cancelScrapAttribute) {
								cancelScrapAttribute.hidden = true;
							}
						},
					},
					{
						name: 'subscriptionId',
						HTMLlabel: 'Subscription',
						HTMLhint: 'You must select a subscription to attach this brand to.',
						attributeType: 'select',
						required: true,
						// disabled: options?.brand?.ownerId !== this._usersRepository.connectedUser$$.value?.id,
						extra: {
							options: this.subscriptions.map((subscription) => {
								const displayedSubscriptionName =
									(subscription.name ?? subscription.id.substring(0, 8)) +
									'  ( used brands: ' +
									(subscription.usedBrandingKits ?? 0) +
									'/' +
									(subscription.maxAvailableBrandingKits ?? 0) +
									' )';

								return {
									name: displayedSubscriptionName,
									value: subscription.id,
									disabled:
										(subscription.usedBrandingKits ?? 0) >= (subscription.maxAvailableBrandingKits ?? 0),
								};
							}),
						},
						defaultValue: this.subscriptions.find(
							(subscription) =>
								(subscription.usedBrandingKits ?? 0) < (subscription.maxAvailableBrandingKits ?? 0)
						)?.id,
					},
					{
						name: 'groups',
						HTMLlabel: 'Share with',
						defaultValue: [],
						attributeType: 'select',
						multiple: true,
						hidden: !options?.canEditSharedGroups,
						extra: {
							options: this._groupsForSharing
								?.filter((group) => group.kind === 'team' || group.kind === 'folder')
								.map((group) => {
									const displayedGroupName = group.name || group.description || group.kind;
									return {
										name: displayedGroupName,
										value: group.id,
									};
								}),
						},
					},
					{
						name: 'images',
						HTMLlabel: 'Images',
						attributeType: 'objectThumbnails',
						// colorThief: true,
						defaultValue: [],
						extra: {
							// colorEventTarget: 'brandColors' // TODO: accept color in editor
							maxObjectsSelected: 3,
							objectList: {
								getNewObjects$: this._fileUploadService.getNewImages$,
								displayDeleteButton: true,
							},
						},
					},
					{
						name: 'brandColors',
						HTMLlabel: 'Colors',
						attributeType: 'color',
						defaultValue: [],
						multiple: true,
					},
				],
				initialCallback: (promptComponent: ObjectPromptComponent<ExtendedBrand>) => {
					// combineLatest(
					// 	(brandData.images ?? []).map((imageUrl) => this._filesRepository.convertRSurlToUrl$(imageUrl))
					// )
					// 	.pipe(
					// 		untilDestroyed(promptComponent),
					// 		tap((imageUrls) => {
					// 			console.log('images URLs:', imageUrls);
					// 			promptComponent.attributeForm.patchValue({
					// 				images: imageUrls,
					// 			});
					// 			// const imagesAttribute = promptComponent.attributes.find(
					// 			// 	(oa) => oa.name == 'images'
					// 			// );
					// 			// if (imagesAttribute){
					// 			// 	imagesAttribute.
					// 			// }
					// 		})
					// 	)
					// 	.subscribe();
				},
			})
			.pipe(
				map((result: Partial<ExtendedBrand> | undefined) => {
					if (!result) return undefined;

					brandData.images =
						result.images
							?.map((imageThumbnail) => {
								if (imageThumbnail.object?.id) return 'rs://' + imageThumbnail.object?.id;
								return imageThumbnail.imageUrl;
							})
							.filter((imageUri): imageUri is string => !!imageUri) ?? [];

					brandData.images = uniq(brandData.images);
					brandData.sharedWith = result.groups;

					const brandColorsAsStr = convertColorListToBrandColors(result.brandColors);

					if (options?.brand) {
						const updatedBrand: Brand = {
							...options.brand,
							name: result.name ?? options.brand.name,
							description: result.description,
							domain: result.domain,
							colors: brandColorsAsStr,
							subscriptionId: result.subscriptionId,
							logo: result.logo,
							data: JSON.stringify(brandData),
						};
						this.updateBrand(options.brand.id, updatedBrand);
						return updatedBrand;
					} else {
						const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
						if (!ownerId) return undefined;
						const newBrand: Brand = {
							id: options?.brandId ?? uuidv4(),
							ownerId,
							name: result.name ?? 'Untitled branding kit',
							domain: result.domain,
							description: result.description,
							colors: brandColorsAsStr,
							data: JSON.stringify(brandData),
							logo: result.logo,
							subscriptionId: result.subscriptionId,
						};
						this.addBrand(newBrand);
						return newBrand;
					}
				})
			);
	}

	/**
	 * Open the object prompt to create/edit an audiopack
	 */
	public openAudioPackPromptEditor(options?: {
		audioPackId?: string;
		audioPack?: AudioPack;
		brand?: Brand;
		modalTitle?: string;
		modalSubmitText?: string;
	}): Observable<AudioPack | undefined> {
		return this._objectPromptService
			.openObjectPromptModal$<Partial<AudioPack>>({
				modalTitle: options?.modalTitle ?? 'Edit your audio pack',
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.audioPackId,
				object: {
					...options?.audioPack,
				},
				attributes: [
					{
						name: 'name',
						HTMLlabel: 'Name',
						defaultValue: '',
						required: true,
					},
				],
			})
			.pipe(
				map((result) => {
					if (!result || !result.name || !options?.brand) return undefined;
					const emptyBrandData: BrandData = {};
					const brandData: BrandData = options.brand.data ? JSON.parse(options.brand.data) : emptyBrandData;
					const audioPacks = brandData.audioPacks ?? [];
					const existingAudioPackIndex = audioPacks.findIndex((audioPack) => audioPack.id === options.audioPack?.id);
					if (existingAudioPackIndex > -1) {
						audioPacks[existingAudioPackIndex].name = result.name;
						brandData.audioPacks = audioPacks;
						const newBrandDataAsStr = JSON.stringify(brandData);
						this.updateBrand(options.brand.id, { data: newBrandDataAsStr });
						return audioPacks[existingAudioPackIndex];
					} else {
						const newAudioPack: AudioPack = {
							id: uuidv4(),
							name: result.name,
							audioPackItems: [],
						};
						audioPacks.push(newAudioPack);
						brandData.audioPacks = audioPacks;
						const newBrandDataAsStr = JSON.stringify(brandData);
						this.updateBrand(options.brand.id, { data: newBrandDataAsStr });
						return newAudioPack;
					}
				})
			);
	}

	/**
	 * Open the object prompt to create/edit an audiopack item
	 */
	public openAudioPackItemPromptEditor(options?: {
		audioPackItemId?: string;
		audioPack?: AudioPack;
		audioPackItem?: AudioPackItem;
		brand?: Brand;
		modalTitle?: string;
		modalSubmitText?: string;
	}): Observable<AudioPackItem | undefined> {
		type ExtendedAudioPackItem = Partial<AudioPackItem> & {
			entityFilesListWithOwner?: FileWithOwner[];
			clearAudioContent?: undefined;
		};

		const audioVideoEntityFiles: FileWithOwner[] = this._filesRepository
			.getAll()
			.filter((entityFile) => entityFile.kind === 'audio' || entityFile.kind === 'video')
			.map((entityFile) => ({ ...entityFile, owner: this._usersRepository.get(entityFile.ownerId) }));

		let fileWithOwner: FileWithOwner | undefined;

		if (options?.audioPackItem?.fileId) {
			const fileId = options.audioPackItem.fileId;
			fileWithOwner = audioVideoEntityFiles.find((entityFile) => entityFile.id === fileId);
		}

		const filePlayerAttribute: ObjectAttribute<ExtendedAudioPackItem>[] = [
			{
				name: 'fileId',
				HTMLlabel: 'Audio content',
				attributeType: 'customComponent',
				extra: {
					customComponent: FilePlayerComponent,
					customPropertiesMapping: {
						fileId: options?.audioPackItem?.fileId,
						displayDetails: false,
					},
				},
			},
			{
				name: 'clearAudioContent',
				HTMLlabel: 'Clear audio content',
				attributeType: 'button',
				HTMLInputSubtype: 'button',
				callBack: (value, promptComponent) => {
					promptComponent.attributeForm.get('fileId')?.patchValue(undefined);
					const currentAttr = promptComponent.attributes.find((att) => att.name === 'clearAudioContent');
					const fileIdAttr = promptComponent.attributes.find((att) => att.name === 'fileId');
					if (currentAttr) {
						currentAttr.hidden = true;
					}

					if (fileIdAttr) {
						fileIdAttr.hidden = true;
					}

					const attr = promptComponent.attributes.find((att) => att.name === 'entityFilesListWithOwner');
					if (attr) {
						attr.hidden = false;
						attr.multipleRange = { min: 1, max: 1 };
						promptComponent._check();
					}
				},
			},
		];

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedAudioPackItem>({
				modalTitle: options?.modalTitle ?? 'Edit your audio pack item',
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.audioPackItemId,
				object: {
					...options?.audioPackItem,
				},
				attributes: [
					{
						name: 'audioTitle',
						HTMLlabel: 'Audio item title (alias)',
						defaultValue: '',
						required: true,
					},
					{
						name: 'audioDescription',
						HTMLlabel: 'Audio item description (alias)',
						defaultValue: '',
					},
					{
						name: 'entityFilesListWithOwner',
						HTMLlabel: 'Audio content',
						attributeType: 'customComponent',
						hidden: !!options?.audioPackItem?.fileId,
						required: true,
						extra: {
							customComponent: FileTableComponent,
							customPropertiesMapping: {
								files: audioVideoEntityFiles,
								allowSelection: true,
								maxObjectsSelected: 1,
								displayExtraFileProperties: true,
							},
						},
						multiple: true,
						multipleRange: options?.audioPackItem?.fileId ? { min: undefined, max: undefined } : { min: 1, max: 1 },
					},
					...(fileWithOwner ? [...filePlayerAttribute] : []),
				],
			})
			.pipe(
				map((result: Partial<ExtendedAudioPackItem> | undefined) => {
					const brandId = options?.brand?.id;
					if (!result?.entityFilesListWithOwner && !result?.fileId) return;
					const entityFile = result.entityFilesListWithOwner ? result.entityFilesListWithOwner[0] : undefined;
					const fileId = entityFile ? entityFile.id : result.fileId ?? undefined;
					if (!result || !result.audioTitle || !fileId || !brandId) return undefined;
					const existingAudioPackItemIndex =
						options?.audioPack?.audioPackItems.findIndex(
							(audioPackItem) => audioPackItem.id === options?.audioPackItem?.id
						) ?? -1;

					const emptyBrandData: BrandData = {};
					const brandData: BrandData = options?.brand?.data ? JSON.parse(options.brand.data) : emptyBrandData;
					const audioPacks = brandData.audioPacks ?? [];
					const existingAudioPackIndex = audioPacks.findIndex((audioPack) => audioPack.id === options?.audioPack?.id);

					const audioPack = audioPacks[existingAudioPackIndex];

					if (existingAudioPackItemIndex > -1) {
						audioPack.audioPackItems[existingAudioPackItemIndex].audioTitle = result.audioTitle;
						audioPack.audioPackItems[existingAudioPackItemIndex].audioDescription = result.audioDescription;
						audioPack.audioPackItems[existingAudioPackItemIndex].fileId = fileId;
						const newBrandDataAsStr = JSON.stringify(brandData);
						this.updateBrand(brandId, { data: newBrandDataAsStr });
						return audioPack.audioPackItems[existingAudioPackItemIndex];
					} else {
						const newAudioPackItem: AudioPackItem = {
							audioTitle: result.audioTitle,
							audioDescription: result.audioDescription,
							fileId,
							id: uuidv4(),
						};
						audioPack.audioPackItems.push(newAudioPackItem);
						const newBrandDataAsStr = JSON.stringify(brandData);
						this.updateBrand(brandId, { data: newBrandDataAsStr });
						return newAudioPackItem;
					}
				})
			);
	}

	/**
	 * Launch request to backend to get a scrapping result
	 * @param scrappingResult
	 * @returns
	 */
	private _scrapDomain(scrappingResult: ScrappingState): Observable<ScrappingState> {
		console.log({ scrappingServerResult: scrappingResult });

		return this._restService.post<ScrappingServerResponse>('/brands/scrap', { domain: scrappingResult.domain }).pipe(
			catchError(() => {
				return of({ ...scrappingResult, state: 'aborted' });
			}),
			map((scrappingServerReponse: ScrappingServerResponse) => {
				const newScrappingState: ScrappingState = {
					domain: scrappingResult.domain,
					scrappingServerReponse,
					state: 'requested',
				};
				return newScrappingState;
			})
		);
	}
}
