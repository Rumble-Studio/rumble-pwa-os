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
import { Collection } from '@rumble-pwa/collections/models';
import { CollectionsRepository } from '@rumble-pwa/collections/state';
import { EntityExport } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { FileTableComponent, FileWithOwner } from '@rumble-pwa/files/display';
import { EntityFile } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Item, ItemRank } from '@rumble-pwa/items/models';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { ObjectAttributeOption, ObjectPromptComponent, ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { FilePlayerComponent } from '@rumble-pwa/player/specialised';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { prepEntityForCreation, prepEntityForRefresh, prepEntityForUpdate } from '@rumble-pwa/utils';
import { sortBy, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const storeName = 'items';
const storePropsName = 'itemProps';

export interface ItemUI {
	id: Item['id'];
}

export interface ItemProps {
	data?: string;
}

export const DEFAULT_ITEM_PROPS: ItemProps = {
	data: undefined,
};

export const ITEM_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_ITEM_PROPS,
});

@Injectable({ providedIn: 'root' })
export class ItemsRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public items$: Observable<Item[]>;
	private _itemsToSync$: Observable<Item[]>;
	public itemUIs$: Observable<ItemUI[]>;
	public activeItems$: Observable<Item[]>;
	public activeItem$: Observable<Item | undefined>;
	public itemProps$: Observable<ItemProps>;

	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	/** Collections are used for prompt opening */
	accessibleCollections: Collection[] = [];

	/** Items where ownerId is logged-in user id (including deleted and archived) */
	public ownedItems$: Observable<Item[]>;
	/** Items coming from a group or subfolders or grants */
	public sharedItems$: Observable<Item[]>;
	/** Accessible items */
	public accessibleItems$: Observable<Item[]>;

	constructor(
		private _restService: RestService,
		private _usersRepository: UsersRepository,
		private _objectPromptService: ObjectPromptService,
		private _collectionsRepository: CollectionsRepository,
		private _filesRepository: FilesRepository,
		private _fileUploadService: FileUploadService,
		private _exportsRepository: ExportsRepository
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.items$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.itemUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeItem$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeItems$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.itemProps$ = this._store$$.pipe(ITEM_PROPS_PIPES.selectItemProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//
		// fetch data or clear data based on logged in status
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.fetchFromServer(true);
			} else {
				console.log('%c[itemsRepository](constructor)', 'color:red', 'Clearing store');

				this._store$$.reset();
			}
		});

		// Instantiate itemsToSyncs$
		this._itemsToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);

		// Sync items
		this._itemsToSync$
			.pipe(
				debounceTime(500),
				tap((itemsToSync) => {
					itemsToSync.forEach((item) => {
						if (item?.operation === 'creation') {
							this._postToServer(item);
						} else if (item?.operation === 'update') this._putToServer(item);
					});
				}),
				tap(() => this._collectionsRepository.fetchFromServer())
			)
			.subscribe();

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// get all collection for item prompt
		this._collectionsRepository.accessibleCollections$
			.pipe(
				tap((collections) => {
					this.accessibleCollections = [...collections.filter((c) => c.state === 'default')];
				})
			)
			.subscribe();

		// item that are owned by the connected user
		this.ownedItems$ = combineLatest([this.items$, this._usersRepository.connectedUser$$]).pipe(
			map(([items, profile]) => items.filter((item) => item.ownerId === profile?.id))
		);

		//
		this.sharedItems$ = new BehaviorSubject<Item[]>([]);

		// get accessible brands (owned and shared)
		this.accessibleItems$ = combineLatest([this.ownedItems$, this.sharedItems$]).pipe(
			map(([ownedItems, sharedItems]) => {
				return sortBy(uniq([...ownedItems, ...sharedItems]), ['timeUpdate', 'timeCreation']).reverse();
			}),
			startWith([])
		);
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(item: Item) {
		return this._restService
			.post<Item>('/items', item)
			.pipe(
				tap((r) => {
					this._refreshItem(r);
				})
			)
			.subscribe();
	}

	private _putToServer(item: Item) {
		return this._restService
			.put<Item>('/items/' + item.id, item)
			.pipe(
				tap((r) => {
					this._refreshItem(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<Item[]>('/items')
			.pipe(
				tap((items) => {
					if (replace) {
						this._store$$.update(upsertEntities(items));
					} else {
						items.forEach((item) => {
							this._refreshItem(item);
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
	 * @param items
	 */
	setItems(items: Item[]) {
		this._store$$.update(setEntities(items));
	}

	/**
	 * Add a new item to the collection
	 * @param item
	 */
	addItem(item: Item) {
		const syncableItem = prepEntityForCreation<Item>(item);
		console.log('Adding this item to store:', syncableItem);

		this._store$$.update(addEntities(syncableItem));
	}

	/**
	 * Update an existing item in the collection
	 * @param id
	 * @param itemUpdate (partial)
	 */
	updateItem(id: Item['id'], itemUpdate: Partial<Item>) {
		const idToUse = id ?? itemUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update item without an id');
		}

		const previousItem = this._store$$.query(getEntity(idToUse));
		if (!previousItem) {
			throw new Error(`Item with id ${idToUse} not found`);
		}
		const updatedItem: Item = {
			...previousItem,
			...itemUpdate,
		};
		const syncableItem = prepEntityForUpdate<Item>(updatedItem, previousItem);
		this._store$$.update(updateEntities(idToUse, syncableItem));
	}

	/**
	 * Upsert an entity (creates it if missing) respecting elfSyncable concept
	 * @param item
	 */
	public upsertItem(item: Item) {
		const previousItem = this._store$$.query(getEntity(item.id));
		if (previousItem) {
			this.updateItem(item.id, item);
		} else {
			this.addItem(item);
		}
	}

	private _refreshItem(item: Item) {
		const previousItem = this._store$$.query(getEntity(item.id));
		const syncableItem = prepEntityForRefresh<Item>(item, previousItem);
		this._store$$.update(upsertEntities([syncableItem]));
	}

	/**
	 * Subscribe to a item
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<Item | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string): Item | undefined {
		return this._store$$.query(getEntity(id));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	setActiveId(id: Item['id']) {
		this._store$$.update(setActiveId(id));
	}

	toggleActiveIds(ids: Array<Item['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setItemProps(itemProps: Partial<ItemProps>) {
		this._store$$.update(ITEM_PROPS_PIPES.updateItemProps(itemProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Item>(),
			withUIEntities<ItemUI>(),
			ITEM_PROPS_PIPES.withItemProps(),
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

	public openPromptEditor(options?: {
		itemId?: string;
		item?: Item;
		modalTitle?: string;
		modalSubmitText?: string;
	}): Observable<Item | undefined> {
		type ExtendedItem = Partial<Item> & {
			entityFilesListWithOwner?: FileWithOwner[];
			artworks?: ObjectThumbnail<EntityFile>[];
			clearAudioContent?: any;
			collectionWithPotentialRank?: { collectionId: string; rank: number }[];
		};

		const audioVideoEntityFiles: FileWithOwner[] = this._filesRepository
			.getAll()
			.filter((entityFile) => entityFile.kind === 'audio' || entityFile.kind === 'video')
			.map((entityFile) => ({ ...entityFile, owner: this._usersRepository.get(entityFile.ownerId) }));

		let selectedFileWithOwner: FileWithOwner | undefined;

		if (options && options.item && options.item.fileId) {
			const fileId = options.item.fileId;
			selectedFileWithOwner = audioVideoEntityFiles.find((entityFile) => entityFile.id === fileId);
		}

		// convert collections as attribute options, sorted by name
		const collectionWithPotentialRankAttributeOptions: ObjectAttributeOption[] = sortBy(
			this.accessibleCollections.map((collection) => {
				const potentialRank: number = collection.ranks?.length ?? 0;
				const collectionWithRankAsOption: ObjectAttributeOption = {
					name: collection.title + ' #' + (potentialRank + 1),
					value: { collectionId: collection.id, rank: potentialRank },
				};
				return collectionWithRankAsOption;
			}),
			['name']
		);

		const artworks: ObjectThumbnail<EntityFile>[] = [
			this._filesRepository.convertURIToObjectThumbnail(
				options?.item?.artworkFileId ? 'rs://' + options.item.artworkFileId : undefined
			),
		].filter((imageThumbnail): imageThumbnail is ObjectThumbnail<EntityFile> => !!imageThumbnail);

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedItem>({
				modalTitle: options?.modalTitle ?? (options?.item ? 'Edit your item' : 'Create a new item'),
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.itemId,
				object: {
					...options?.item,
					entityFilesListWithOwner: [],
					artworks,
					// collectionIds: this.accessibleCollections.map((c) => c.id),
					// collectionWithPotentialRank: collectionWithPotentialRankAttributeOptions.map((o) => o.value),
				},
				attributes: [
					{
						name: 'title',
						HTMLlabel: 'Title',
						defaultValue: '',
						HTMLhint: 'Public title of your item',
						placeholder: 'Ex. Episode 1',
						required: true,
						validators: Validators.maxLength(256),
					},
					{
						name: 'description',
						attributeType: 'textarea',
						HTMLhint: 'Public description of your item',
						required: true,
						HTMLlabel: 'Description',
						validators: Validators.maxLength(1024),
					},
					{
						name: 'collectionWithPotentialRank',
						HTMLlabel: 'Collection',
						HTMLhint: 'Select the collection(s) that will contain this item',
						placeholder: 'New collection...',
						attributeType: 'select',
						multiple: true,
						defaultValue: [],
						extra: {
							options: collectionWithPotentialRankAttributeOptions,
						},
					},
					{
						name: 'artworks',
						HTMLlabel: 'Artwork',
						explanation: 'It will be used as a thumbnail of your item',
						attributeType: 'objectThumbnails',
						defaultValue: [],
						extra: {
							maxObjectsSelected: 1,
							objectList: {
								getNewObjects$: this._fileUploadService.getNewImages$,
								displayDeleteButton: true,
								objectFit: 'contain',
							},
						},
					},
					{
						name: 'entityFilesListWithOwner',
						HTMLlabel: 'Audio content',
						attributeType: 'customComponent',
						hidden: !!options?.item?.fileId,
						required: true,
						extra: {
							customComponent: FileTableComponent,
							customPropertiesMapping: {
								files: audioVideoEntityFiles,
								allowSelection: true,
								maxObjectsSelected: 1,
							},
						},

						callBack: (value: FileWithOwner[], promptComponent: ObjectPromptComponent<ExtendedItem>) => {
							if (value.length === 0) return;

							this._exportsRepository
								.getExportsByFileId$(value[0].id)
								.pipe(
									take(1),
									switchMap((entityExports) => {
										if (entityExports.length === 0) {
											return this._exportsRepository
												.openExportFilePrompt(value[0].id, value[0].duration, {
													modalTitle: 'You must export this file',
													modalDescription:
														'In order to use this file as an item, you must export it.',
												})
												.pipe(map((entityExport) => [entityExport]));
										}
										return of(entityExports);
									}),
									map((entityExports) =>
										entityExports.filter((entityExport): entityExport is EntityExport => !!entityExport)
									),
									tap((entityExports) => {
										if (entityExports.length < 1) {
											promptComponent.attributeForm.get('entityFilesListWithOwner')?.patchValue([]);
										}
									})
								)
								.subscribe();
						},
					},
					{
						name: 'fileId',
						HTMLlabel: 'Audio content',
						attributeType: 'customComponent',
						hidden: !selectedFileWithOwner,
						extra: {
							customComponent: FilePlayerComponent,
							customPropertiesMapping: {
								fileId: options?.item?.fileId,
								displayDetails: false,
							},
						},
					},
					{
						name: 'clearAudioContent',
						HTMLlabel: 'Clear audio content',
						attributeType: 'button',
						HTMLInputSubtype: 'button',
						hidden: !selectedFileWithOwner,
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
								promptComponent._check();
							}
						},
					},
				],
			})
			.pipe(
				map((result: Partial<ExtendedItem> | undefined) => {
					if (!result) return undefined;

					const fileId =
						result.entityFilesListWithOwner && result.entityFilesListWithOwner.length > 0
							? result.entityFilesListWithOwner[0].id
							: result.fileId ?? undefined;

					const artworkFileIds =
						result.artworks
							?.map((imageThumbnail) => {
								if (imageThumbnail.object?.id) return imageThumbnail.object?.id;
								return undefined;
							})
							.filter((imageUri): imageUri is string => !!imageUri) ?? [];

					// If prompt is used to edit an existing item
					// const item = options?.item;
					if (options?.item) {
						const updatedItem: Item = {
							...options.item,
							title: result.title ?? options.item.title,
							description: result.description ?? options.item.description,
							artworkFileId: artworkFileIds[0],
							// collectionIds: result.collectionIds,
							fileId: fileId,
						};
						this.updateItem(options.item.id, updatedItem);

						console.warn('NOT IMPLEMENTED (UPDATE):', result.collectionWithPotentialRank);

						// const mergedItem: Item = {
						// 	...item,
						// 	...options.item,
						// };

						// const updateItemRanks$ = this.updateItemRanks$(
						// 	item.id,
						// 	result.collectionWithPotentialRank ?? [],
						// 	curentCollectionsFromItemRanks
						// ).pipe(
						// 	map((result) => {
						// 		return result ? mergedItem : undefined;
						// 	})
						// );
						// return updateItemRanks$;
						return updatedItem;
					} else {
						// 	// If prompt is used to create a new item
						const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
						if (!ownerId) return undefined;
						if (!result.title) return;
						if (!result.description) return;
						const newItem: Item = {
							id: options?.itemId ?? uuidv4(),
							ownerId,
							title: result.title,
							description: result.description,
							artworkFileId: artworkFileIds.length > 0 ? artworkFileIds[0] : undefined,
							collectionIds: result.collectionWithPotentialRank?.map((cwpr) => cwpr.collectionId) ?? [],
							fileId,
						};
						this.addItem(newItem);

						// sortBy(result.collectionWithPotentialRank, ['rank']).forEach((cwpr) =>
						// 	this.addItemToCollection(newItem.id, cwpr.collectionId)
						// );

						// 	// const updateItemRanks$ = this.updateItemRanks$(id, result.collectionWithPotentialRank ?? []).pipe(
						// 	// 	map((result) => {
						// 	// 		return result ? newItem : undefined;
						// 	// 	})
						// 	// );

						// 	// return updateItemRanks$;
						return newItem;
					}
				})
			);
	}

	/**
	 * Add an item to a collection
	 * @param itemId
	 * @param collectionId
	 * @param rank if not provided, rank = (rank of the last item of collection) + 1
	 * @returns
	 */
	public addItemToCollection(itemId: string, collectionId: string) {
		const item = this.get(itemId);
		const collection = this._collectionsRepository.get(collectionId);
		if (!item || !collection) return;
		const newRank: number = collection.ranks?.length ?? 0;
		console.log('Adding', itemId, 'to', collectionId, 'at', newRank);

		return this._restService
			.post<ItemRank>('/collections/' + collectionId + '/add/' + itemId + '/' + newRank, {})
			.pipe(
				tap(() => {
					this.fetchFromServer();
					this._collectionsRepository.fetchFromServer();
				})
			)
			.subscribe();
	}

	/**
	 * Remove an item from a collection
	 * @param itemId
	 * @param collectionId
	 * @param index
	 * @param refreshCollectionItemsRank if true (by default), it will refresh items rank of the collection.
	 * If you have multiple deletions in a row, consider using false until the last deletion.
	 * @returns
	 */
	public unlistItemFromCollection(collectionId: string, index: number) {
		this._restService
			.delete<boolean>('/collections/' + collectionId + '/unlist/' + index)
			.pipe(
				tap(() => {
					this.fetchFromServer();
					this._collectionsRepository.fetchFromServer();
				})
			)
			.subscribe();
	}

	/**
	 * Update a rank of an item within a collection
	 * @param collectionId
	 * @param previousRank
	 * @param newRank
	 * @returns an observable of Item
	 */
	public updateItemRankInCollection(collectionId: string, previousRank: number, newRank: number) {
		this._restService
			.put<Item>('/collections/' + collectionId + '/reorder/' + previousRank + '/' + newRank, {})
			.pipe(
				tap(() => {
					this.fetchFromServer();
					this._collectionsRepository.fetchFromServer();
				})
			)
			.subscribe();
	}

	// /**
	//  * Add or delete items to/from a collection, refresh item ranks when complete.
	//  * @param itemId
	//  * @param newCollectionWithRank
	//  * @param currentCollectionWithRank
	//  * @returns
	//  */
	// public updateItemRanks$(
	// 	itemId: string,
	// 	newCollectionWithRank: CollectionWithRank[],
	// 	currentCollectionWithRank: CollectionWithRank[] = []
	// ) {
	// 	console.log('updateItemsRanks....');
	// 	return of(undefined);
	// 	// let alreadyProccessing = false;
	// 	// return this.get$(itemId).pipe(
	// 	// 	switchMap((item) => {
	// 	// 		if (!item) return of(undefined);
	// 	// 		return of(item.toSync ? undefined : item);
	// 	// 	}),
	// 	// 	switchMap((item) => {
	// 	// 		if (!item || alreadyProccessing) return of(undefined);
	// 	// 		alreadyProccessing = true;

	// 	// 		const collectionsWithRankToRemove = currentCollectionWithRank.filter(
	// 	// 			(collectionWithRank) => !newCollectionWithRank.includes(collectionWithRank)
	// 	// 		);

	// 	// 		const collectionsWithRankToAdd = newCollectionWithRank.filter(
	// 	// 			(collection) => !currentCollectionWithRank.includes(collection)
	// 	// 		);

	// 	// 		const collectionIdsToRemove$ = collectionsWithRankToRemove.map((collectionWithRank) =>
	// 	// 			this.removeItemFromCollection$(itemId, collectionWithRank.collection.id, collectionWithRank.rank, false)
	// 	// 		);
	// 	// 		const collectionToAdd$ =
	// 	// 			collectionsWithRankToAdd?.map((collectionWithRank) =>
	// 	// 				this.addItemToCollection$(itemId, collectionWithRank.collection.id)
	// 	// 			) ?? [];

	// 	// 		return combineLatest([...collectionIdsToRemove$, ...collectionToAdd$]);
	// 	// 	}),
	// 	// 	tap((result) => {
	// 	// 		if (result) {
	// 	// 			[...newCollectionWithRank, ...currentCollectionWithRank].forEach((collectionWithRank) =>
	// 	// 				this.refreshCollectionRanks(collectionWithRank.collection.id)
	// 	// 			);
	// 	// 		}
	// 	// 	})
	// 	// );
	// }
}
