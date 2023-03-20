import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
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
import { Category, Collection, Language, Type } from '@rumble-pwa/collections/models';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Item } from '@rumble-pwa/items/models';
import { ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { RestService } from '@rumble-pwa/requests';
import { convertUserToDisplayableName } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { prepEntityForCreation, prepEntityForRefresh, prepEntityForUpdate } from '@rumble-pwa/utils';
import { sortBy, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const storeName = 'collections';
const storePropsName = 'collectionProps';

export interface CollectionUI {
	id: Collection['id'];
}

export interface CollectionProps {
	categories: Category[];
	types: Type[];
	languages: Language[];
}

export const DEFAULT_COLLECTION_PROPS: CollectionProps = {
	categories: [],
	types: [],
	languages: [],
};

export const COLLECTION_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_COLLECTION_PROPS,
});

@Injectable({ providedIn: 'root' })
export class CollectionsRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public collections$: Observable<Collection[]>;
	private _collectionsToSync$: Observable<Collection[]>;
	public collectionUIs$: Observable<CollectionUI[]>;
	public activeCollections$: Observable<Collection[]>;
	public activeCollection$: Observable<Collection | undefined>;
	public collectionProps$: Observable<CollectionProps>;

	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//
	/** Collections where ownerId is logged-in user id (including deleted and archived) */
	public ownedCollections$: Observable<Collection[]>;
	/** Collections coming from a group or subfolders or grants */
	public sharedCollections$: Observable<Collection[]>;
	/** Accessible items */
	public accessibleCollections$: Observable<Collection[]>;
	constructor(
		private _restService: RestService,
		private _objectPromptService: ObjectPromptService,
		private _filesRepository: FilesRepository,
		private _usersRepository: UsersRepository
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.collections$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.collectionUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeCollection$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeCollections$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.collectionProps$ = this._store$$.pipe(COLLECTION_PROPS_PIPES.selectCollectionProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		this._fetchCategoriesFromServer();
		this._fetchLanguagesFromServer();
		this._fetchTypesFromServer();

		// fetch data or clear data based on logged in status
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.fetchFromServer(true);
			} else {
				this._store$$.reset();
			}
		});

		// Instantiate collectionsToSync$
		this._collectionsToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);

		// Sync collections
		this._collectionsToSync$.pipe(debounceTime(500)).subscribe((collectionsToSync) => {
			collectionsToSync.forEach((collection) => {
				if (collection?.operation === 'creation') {
					this._postToServer(collection);
				} else if (collection?.operation === 'update') this._putToServer(collection);
			});
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// item that are owned by the connected user
		this.ownedCollections$ = combineLatest([this.collections$, this._usersRepository.connectedUser$$]).pipe(
			map(([collections, profile]) => collections.filter((collection) => collection.ownerId === profile?.id))
		);

		//
		this.sharedCollections$ = new BehaviorSubject<Collection[]>([]);

		// get accessible brands (owned and shared)
		this.accessibleCollections$ = combineLatest([this.ownedCollections$, this.sharedCollections$]).pipe(
			map(([ownedCollections, sharedCollections]) => {
				return sortBy(uniq([...ownedCollections, ...sharedCollections]), ['timeUpdate', 'timeCreation']).reverse();
			}),
			startWith([])
		);
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(collection: Collection) {
		return this._restService
			.post<Collection>('/collections', collection)
			.pipe(
				tap((r) => {
					this._refreshCollection(r);
				})
			)
			.subscribe();
	}

	private _putToServer(collection: Collection) {
		return this._restService
			.put<Collection>('/collections/' + collection.id, collection)
			.pipe(
				tap((r) => {
					this._refreshCollection(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<Collection[]>('/collections')
			.pipe(
				tap((collections) => {
					if (replace) {
						this._store$$.update(upsertEntities(collections));
					} else {
						collections.forEach((collection) => {
							this._refreshCollection(collection);
						});
					}
				})
			)
			.subscribe();
	}

	/**
	 * Request collection/full endpoint to get all relative data to a specific collection
	 * @param collectionId
	 * @returns
	 */
	fetchCollectionData$(collectionId: string) {
		return this._restService
			.get<{
				collection: Collection;
				files: EntityFile[];
				items: Item[];
				languages: Language[];
				categories: Category[];
			}>('/collections/' + collectionId + '/full')
			.pipe(
				tap((r) => {
					this.upsertCollection({ ...r.collection, operation: 'refresh' });

					this.setCollectionProps({ languages: r.languages });

					this.setCollectionProps({ categories: r.categories });

					r.files.forEach((file) => {
						this._filesRepository.refreshEntityFile(file);
					});
				})
			);
	}

	// Fetch props

	private _fetchCategoriesFromServer() {
		this._restService
			.get<Category[]>('/categories')
			.pipe(
				tap((categories) => {
					this.setCollectionProps({ categories });
				})
			)
			.subscribe();
	}

	private _fetchTypesFromServer() {
		this._restService
			.get<Type[]>('/types')
			.pipe(
				tap((types) => {
					this.setCollectionProps({ types });
				})
			)
			.subscribe();
	}

	private _fetchLanguagesFromServer() {
		this._restService
			.get<Language[]>('/languages')
			.pipe(
				tap((languages) => {
					this.setCollectionProps({ languages });
				})
			)
			.subscribe();
	}

	// Get RSS Feed XML

	public getRSSFeedXMLLink(collectionId: string) {
		const rssUrl = this._restService.apiRoot + '/collections/' + collectionId + '/rss/default.xml';
		return rssUrl;
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   ENTITY METHODS                   //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Replace current collection with the provided collection
	 * @param collections
	 */
	setCollections(collections: Collection[]) {
		this._store$$.update(setEntities(collections));
	}

	/**
	 * Add a new collection
	 * @param collection
	 */
	addCollection(collection: Collection) {
		const syncableCollection = prepEntityForCreation<Collection>(collection);
		this._store$$.update(addEntities(syncableCollection));
	}

	/**
	 * Update an existing collection in the collection
	 * @param id
	 * @param collectionUpdate (partial)
	 */
	updateCollection(id: Collection['id'] | undefined, collectionUpdate: Partial<Collection>) {
		const idToUse = id ?? collectionUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update collection without an id');
		}

		const previousCollection = this._store$$.query(getEntity(idToUse));
		if (!previousCollection) {
			throw new Error(`Collection with id ${idToUse} not found`);
		}
		const updatedCollection: Collection = {
			...previousCollection,
			...collectionUpdate,
		};
		const syncableCollection = prepEntityForUpdate<Collection>(updatedCollection, previousCollection);
		this._store$$.update(updateEntities(idToUse, syncableCollection));
	}

	/**
	 * Upsert an entity (creates it if missing) respecting elfSyncable concept
	 * @param collection
	 */
	public upsertCollection(collection: Collection) {
		const previousCollection = this._store$$.query(getEntity(collection.id));
		if (previousCollection) {
			this.updateCollection(collection.id, collection);
		} else {
			this.addCollection(collection);
		}
	}

	private _refreshCollection(collection: Collection) {
		const previousCollection = this._store$$.query(getEntity(collection.id));
		const syncableCollection = prepEntityForRefresh<Collection>(collection, previousCollection);
		this._store$$.update(upsertEntities([syncableCollection]));
	}

	/**
	 * Subscribe to a collection
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<Collection | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string): Collection | undefined {
		return this._store$$.query(getEntity(id));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	setActiveId(id: Collection['id']) {
		this._store$$.update(setActiveId(id));
	}

	toggleActiveIds(ids: Array<Collection['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setCollectionProps(collectionProps: Partial<CollectionProps>) {
		this._store$$.update(COLLECTION_PROPS_PIPES.updateCollectionProps(collectionProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Collection>(),
			withUIEntities<CollectionUI>(),
			COLLECTION_PROPS_PIPES.withCollectionProps(),
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

	displayValueCategory(categoryId: Category['id']): string {
		const category = this._store$$.value.collectionProps.categories.find((category) => category.id === categoryId);
		if (!category) return categoryId;
		return category.name ?? category.macroCategory;
	}

	displayValueType(collection: Collection): string {
		return this._store$$.value.collectionProps.types.find((type) => type.id === collection.typeId)?.name ?? '';
	}

	public openPromptEditor(options?: {
		collectionId?: string;
		collection?: Collection;
		modalTitle?: string;
		modalSubmitText?: string;
	}): Observable<Collection | undefined> {
		type ExtendedCollection = Partial<Collection> & {
			resetCustomWebsite?: string;
		};

		const collectionIdToUse = options?.collectionId ?? options?.collection?.id ?? uuidv4();

		const defaultPublicDomain = window.location.origin + '/collections/' + collectionIdToUse + '/public';
		const defaultDomain = options?.collection?.customWebsite ?? defaultPublicDomain;

		const now = new Date();
		const defaultTitle = 'New collection - ' + now.toLocaleDateString();
		const owner = this._usersRepository.connectedUser$$.getValue();
		if (!owner) return of(undefined);

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedCollection>({
				modalTitle: options?.modalTitle ?? 'Edit your collection',
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.collectionId,
				object: {
					...options?.collection,
					customWebsite: defaultDomain,
				},
				attributes: [
					{
						name: 'title',
						HTMLlabel: 'Title',
						defaultValue: defaultTitle,
						placeholder: 'Ex. My favorite episodes',
						required: true,
						validators: Validators.maxLength(256),
					},
					{
						name: 'description',
						attributeType: 'textarea',
						required: true,
						HTMLlabel: 'Description',
						placeholder: 'Ex. Learn more about...',
						defaultValue: 'A collection by ' + convertUserToDisplayableName(owner),
						validators: Validators.maxLength(1024),
					},
					{
						name: 'categoryIds',
						HTMLlabel: 'Category',
						placeholder: 'New category...',
						attributeType: 'select',
						multiple: true,
						required: true,
						multipleRange: {
							max: 3,
						},
						extra: {
							options: this._store$$.value.collectionProps.categories.map((category) => ({
								name: category.name,
								value: category.id,
							})),
						},
					},
					{
						name: 'typeId',
						HTMLlabel: 'Collection Type',
						attributeType: 'select',
						defaultValue: 'podcast',
						extra: {
							options: this._store$$.value.collectionProps.types.map((type) => ({
								name: type.name,
								value: type.id,
							})),
						},
					},
					{
						name: 'publicAuthorName',
						HTMLlabel: 'Public author name',
						placeholder: 'Ex. Jean-Michel McClane',
						required: true,
						defaultValue: convertUserToDisplayableName(owner),
						validators: Validators.maxLength(60),
					},
					{
						name: 'publicAuthorEmail',
						HTMLlabel: 'Public author email',
						placeholder: 'jean-michel.macclane@example.com',
						required: true,
						defaultValue: owner.email,
						validators: Validators.email,
					},
					{
						name: 'customWebsite',
						HTMLlabel: 'Website',
						// hidden: !options?.collection?.id,
						defaultValue: defaultDomain,
						placeholder: 'https://listen.mypodcast.com',
						HTMLInputSubtype: 'url',
						HTMLpattern: 'https://.*',
						validators: Validators.minLength(9),
						required: true,
						HTMLhint:
							'You need to provide an URL where your collection feed is available. Rumble Studio generates one automatically but you can use a Page or a custom website.',
						editCallBack: (value: string) => {
							// nothing if already starts with https
							if (value.substring(0, 8) == 'https://') return value.toLowerCase();

							// replace with https if shorter/equal length but incorrect
							if (value.length <= 7 && value !== 'https://') {
								return 'https://';
							}

							// replace http with https
							if (value.substring(0, 7) == 'http://') return 'https://' + value.substring(7).toLowerCase();

							// whatever: let the user do the job
							return value.toLowerCase();
						},
					},
					{
						name: 'resetCustomWebsite',
						HTMLlabel: 'Fill with default public link',
						attributeType: 'button',
						// hidden: !options?.collection?.id,
						HTMLInputSubtype: 'button',
						callBack: (value, promptComponent) => {
							promptComponent.attributeForm.get('customWebsite')?.patchValue(defaultPublicDomain);
						},
					},
					{
						name: 'languageId',
						HTMLlabel: 'Language',
						attributeType: 'select',
						defaultValue: 'en',
						required: true,
						extra: {
							options: [
								...this._store$$.value.collectionProps.languages
									.filter((language) => !!language.fullName)
									.map((language) => ({ name: language.fullName, value: language.shortName })),
								{ name: 'Other', value: 'en' },
							],
						},
					},
					{
						name: 'isExplicit',
						HTMLlabel: 'Will you present explicit content?',
						attributeType: 'select',
						defaultValue: false,
						extra: {
							options: [
								{
									name: 'No',
									value: false,
								},
								{ name: 'Yes', value: true },
							],
						},
					},
				],
			})
			.pipe(
				map((result: Partial<ExtendedCollection> | undefined) => {
					if (
						!(
							result &&
							result.title &&
							result.typeId &&
							result.categoryIds &&
							result.publicAuthorEmail &&
							result.publicAuthorName &&
							result.customWebsite
						)
					) {
						console.warn('We are missing something to build the collection', { result });
						return undefined;
					}

					// If prompt is used to edit an existing collection
					if (options?.collection) {
						const collectionToUpdate = this.get(options.collection.id);
						if (!collectionToUpdate) return undefined;

						const updatedCollection: Partial<Collection> = {
							...result,
							customWebsite: result.customWebsite.length > 8 ? result.customWebsite : defaultPublicDomain,
							id: collectionIdToUse,
						};

						this.updateCollection(collectionIdToUse, updatedCollection);
						return { ...collectionToUpdate, ...updatedCollection };
					}
					// If prompt is used to create a new collection
					else {
						const newCollection: Collection = {
							id: collectionIdToUse,
							ownerId: owner.id,
							title: result.title,
							typeId: result.typeId,
							categoryIds: result.categoryIds,
							publicAuthorEmail: result.publicAuthorEmail,
							publicAuthorName: result.publicAuthorName,
							customWebsite: result.customWebsite,
							...result,
						};

						this.addCollection(newCollection);
						return newCollection;
					}
				})
			);
	}
}
