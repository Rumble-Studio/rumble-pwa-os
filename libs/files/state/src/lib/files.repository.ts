import { Injectable } from '@angular/core';
import { createStore, emitOnce, propsFactory } from '@ngneat/elf';
import {
	addEntities,
	getAllEntities,
	getEntity,
	hasEntity,
	selectActiveEntities,
	selectActiveEntity,
	selectAllEntities,
	selectAllEntitiesApply,
	selectEntity,
	setActiveId,
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
import { convertEntityFileToUrl, EntityFile, EntityFileData, Filetag, getTranscriptFromData } from '@rumble-pwa/files/models';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Grant } from '@rumble-pwa/mega-store';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { VirtualPlaylist, VirtualTrack } from '@rumble-pwa/player/services';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { NestedPartial, prepEntityForCreation, prepEntityForRefresh, prepEntityForUpdate } from '@rumble-pwa/utils';
import FileSaver from 'file-saver';
import { isEqual, merge, sortBy, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, NEVER, Observable, of } from 'rxjs';
import { catchError, debounceTime, map, shareReplay, skipUntil, startWith, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { DataToPDF } from './pdf.model';
// export { convertEntityFileToUrl, EntityFile, EntityFileData, Filetag, getTranscriptFromData } from '@rumble-pwa/files/models';

const storeName = 'entityFiles';
const storePropsName = 'entityFileProps';

export interface EntityFileUI {
	id: EntityFile['id'];
}
export interface EntityFileProps {
	something?: string;
}

export const DEFAULT_ENTITYFILE_PROPS: EntityFileProps = {
	something: '',
};

export const ENTITYFILE_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_ENTITYFILE_PROPS,
});

// CUSTOM INTERFACE AND CONST
// (empty)

@Injectable({ providedIn: 'root' })
export class FilesRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public entityFiles$: Observable<EntityFile[]>;
	private _entityFilesToSync$: Observable<EntityFile[]>;
	public entityFileUIs$: Observable<EntityFileUI[]>;
	public activeentityFiles$: Observable<EntityFile[]>;
	public activeEntityFile$: Observable<EntityFile | undefined>;
	public entityFileProps$: Observable<EntityFileProps>;

	// private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	/** EntityFiles where ownerId is logged-in user id (including deleted and archived) */
	public ownedEntityFiles$: Observable<EntityFile[]>;
	/** EntityFiles coming from a group (team/folder) or subfolders => used for display in pages (including deleted and archived) */
	public sharedEntityFiles$: Observable<EntityFile[]>;
	/** EntityFiles tagged as public (including deleted and archived). Tagged public means one tag has the `public` tag id. */
	public publicEntityFiles$: Observable<EntityFile[]>;

	/** EntityFiles to fetch */
	idsToFetchFetchedMap = new Map<string, boolean>();
	private _entityFileIdsToFetch$$ = new BehaviorSubject<string[]>([]);

	/** Accessible files */
	public accessibleEntityFiles$: Observable<EntityFile[]>;

	// private _entityFilesMissingTranscript$: Observable<EntityFile[]>;

	/**
	 *
	 * @param _restService
	 * @param _objectPromptService
	 * @param _subscriptionsManagementService  - Used for prompt opening
	 */
	constructor(
		//
		private _restService: RestService,
		private _groupsManagementService: GroupsManagementService, // for shared entityFiles
		private _usersRepository: UsersRepository // for owned entityFiles and virtual track details
	) {
		// console.log('%c[FilesRepository](constructor)', 'color: #00a7e1; font-weight: bold');

		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		// this._persist = persistState(this._store$$, {
		// 	key: storeName,
		// 	storage: localStorageStrategy,
		// 	source: () => this._store$$.pipe(debounceTime(300)),
		// });
		this.entityFiles$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.entityFileUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeEntityFile$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeentityFiles$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.entityFileProps$ = this._store$$.pipe(
			ENTITYFILE_PROPS_PIPES.selectEntityFileProps(),
			shareReplay({ refCount: true })
		);

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		// fetch data or clear data based on logged in status
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.fetchFromServer(true);
			} else {
				this._store$$.reset();
				this._entityFileIdsToFetch$$.next([]);
			}
		});

		// files to sync are files with the `toSync` to `true`
		this._entityFilesToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);

		// build object to sync $
		this._entityFilesToSync$.pipe(debounceTime(500)).subscribe((entityFilesToSync) => {
			entityFilesToSync.forEach((entityFile) => {
				if (entityFile?.operation === 'creation') {
					this._postToServer(entityFile);
				} else if (entityFile?.operation === 'update') this._putToServer(entityFile);
			});
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// entityFile that are owned by the connected user
		this.ownedEntityFiles$ = combineLatest([this.entityFiles$, this._usersRepository.connectedUser$$]).pipe(
			map(([entityFiles, profile]) => entityFiles.filter((entityFile) => entityFile.ownerId === profile?.id)),
			startWith([])
		);

		// use groups and profile to find entityFiles shared with logged-in user
		this.sharedEntityFiles$ = combineLatest([
			this._groupsManagementService.groups$$,
			this._usersRepository.connectedUser$$,
		]).pipe(
			switchMap(([groups, profile]) => {
				const sharedEntityFiles$: Observable<EntityFile | undefined>[] = [];
				if (profile) {
					const entityFileIds: string[] = [];
					groups.forEach((group) => {
						const grants: Grant[] = this._groupsManagementService.fillChildrenRecursively(group.id)?.grants ?? [];
						grants.forEach((grant) => {
							const parameters = JSON.parse(grant.parameters || '{}');
							if (!parameters.entityFileId) return;
							const entityFileId = parameters.entityFileId;
							const entityFile$: Observable<EntityFile | undefined> = this.get$(entityFileId);
							if (entityFileIds.includes(entityFileId)) return;
							entityFileIds.push(entityFileId);
							sharedEntityFiles$.push(entityFile$);
						});
					});
				}
				return combineLatest(sharedEntityFiles$);
			}),
			map((sharedEntityFiles) =>
				sharedEntityFiles.filter((sharedEntityFile): sharedEntityFile is EntityFile => !!sharedEntityFile)
			),
			startWith([])
		);

		// Public files are file with the `public` tag id
		this.publicEntityFiles$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => (e.filetags ? e.filetags.some((tag) => tag.id === 'public') : false),
			})
		);

		// get accessible files (owned, shared and public)
		this.accessibleEntityFiles$ = combineLatest([
			this.ownedEntityFiles$,
			this.sharedEntityFiles$,
			this.publicEntityFiles$,
		]).pipe(
			map(([ownedFiles, sharedFiles, publicFiles]) => {
				return sortBy(uniq([...ownedFiles, ...sharedFiles, ...publicFiles]), ['timeUpdate', 'timeCreation']).reverse();
			})
			// skipUntil(this._persist.initialized$)
		);

		// fetch server about missing entityFiles
		this._entityFileIdsToFetch$$
			.pipe(
				debounceTime(200),
				switchMap((entityFileIdsToFetch) => {
					// console.log({ entityFileIdsToFetch });
					return combineLatest(
						entityFileIdsToFetch.map((entityFileIdToFetch) => this.fetchOneFromServer$(entityFileIdToFetch))
					);
				})
			)
			.subscribe();

		// files to get transcript for
		this._store$$
			.pipe(
				selectAllEntitiesApply({
					filterEntity: (entityFile) => {
						const deepgramTranscript = getTranscriptFromData(entityFile, 'original_deepgram_20220620');
						const gcpTranscript = getTranscriptFromData(entityFile, 'original_gcp_20210124');
						const manualTranscript = getTranscriptFromData(entityFile, 'edited_manual');
						return (
							!(!!deepgramTranscript || !!gcpTranscript || !!manualTranscript) &&
							['video', 'audio'].includes(entityFile.kind ?? '')
						);
					},
				})
				// tap((entityFiles) => {
				// 	console.log('Missing transcript for those files:', entityFiles);
				// })
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(entityFile: EntityFile) {
		return this._restService
			.post<EntityFile>('/files', entityFile)
			.pipe(
				tap((r) => {
					this.refreshEntityFile(r);
				})
			)
			.subscribe();
	}

	private _putToServer(entityFile: EntityFile) {
		return this._restService
			.put<EntityFile>(`/files/${entityFile.id}`, entityFile)
			.pipe(
				tap((r) => {
					this.refreshEntityFile(r);
				})
			)
			.subscribe();
	}

	public fetchOneFromServer$(id: string) {
		return this._restService.get<EntityFile>('/files/' + id).pipe(
			tap((entityFile) => {
				this.refreshEntityFile(entityFile);
				this.idsToFetchFetchedMap.set(id, true);
			}),
			catchError(() => {
				this.idsToFetchFetchedMap.set(id, true);
				return NEVER;
			})
		);
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<EntityFile[]>('/files')
			.pipe(
				tap((entityFiles) => {
					if (replace) {
						this._store$$.update(upsertEntities(entityFiles));
					} else {
						emitOnce(() => {
							entityFiles.forEach((entityFile) => {
								this.refreshEntityFile(entityFile);
							});
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

	// /**
	//  * Replace current collection with the provided collection
	//  * @param entityFiles
	//  */
	// public setEntityFiles(entityFiles: EntityFile[]) {
	// 	console.log('[FilesRepo](set) not implemented', entityFiles);

	//
	// 	// this._store$$.update(setEntities(entityFiles));
	// }

	/**
	 * Add a new entityFile to the collection
	 * @param entityFile
	 */
	public addEntityFile(entityFile: EntityFile) {
		// console.log('[FilesRepo](add)', entityFile);
		const syncableEntityFile = prepEntityForCreation<EntityFile>(entityFile);
		this._store$$.update(addEntities(syncableEntityFile));
	}

	/**
	 * Update an existing entityFile in the collection
	 * @param id
	 * @param entityFileUpdate (partial)
	 */
	public updateEntityFile(id: EntityFile['id'] | undefined, entityFileUpdate: Partial<EntityFile>) {
		// console.log('[FilesRepo](update)', id, entityFileUpdate);

		const idToUse = id ?? entityFileUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update entityFile without an id');
		}

		const previousEntityFile = this._store$$.query(getEntity(idToUse));
		if (!previousEntityFile) {
			throw new Error(`EntityFile with id ${idToUse} not found`);
		}
		const updatedEntityFile: EntityFile = {
			...previousEntityFile,
			...entityFileUpdate,
		};
		const syncableEntityFile = prepEntityForUpdate<EntityFile>(updatedEntityFile, previousEntityFile);
		this._store$$.update(updateEntities(idToUse, syncableEntityFile));
	}

	/**
	 * Upsert an entity (creates it if missing) respecting elfSyncable concept
	 * @param entityFile
	 */
	public upsertEntityFile(entityFile: EntityFile) {
		// console.log('[FilesRepo](upsert)', entityFile);
		const previousEntityFile = this._store$$.query(getEntity(entityFile.id));
		if (previousEntityFile) {
			this.updateEntityFile(entityFile.id, entityFile);
		} else {
			this.addEntityFile(entityFile);
		}
	}

	/**
	 * Refresh is public to be called by filetag repo
	 * @param entityFile
	 */
	public refreshEntityFile(entityFile: EntityFile) {
		const previousEntityFile = this._store$$.query(getEntity(entityFile.id));
		const syncableEntityFile = prepEntityForRefresh<EntityFile>(entityFile, previousEntityFile);
		if (!isEqual(previousEntityFile, syncableEntityFile)) this._store$$.update(upsertEntities([syncableEntityFile]));
	}

	/**
	 * Subscribe to a entityFile
	 * @param id
	 * @returns
	 */
	public get$(id: string, fetch = true): Observable<EntityFile | undefined> {
		if (fetch) this._fetchThisId(id);
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string, fetch = true): EntityFile | undefined {
		if (fetch) this._fetchThisId(id);
		return this._store$$.query(getEntity(id));
	}

	public getAll(): EntityFile[] {
		return this._store$$.query(getAllEntities());
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	public setActiveId(id: EntityFile['id']) {
		this._store$$.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<EntityFile['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setEntityFileProps(entityFileProps: Partial<EntityFileProps>) {
		this._store$$.update(ENTITYFILE_PROPS_PIPES.updateEntityFileProps(entityFileProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<EntityFile>(),
			withUIEntities<EntityFileUI>(),
			ENTITYFILE_PROPS_PIPES.withEntityFileProps(),
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

	private _fetchThisId(id: string) {
		if (!this._store$$.query(hasEntity(id)) && !this.idsToFetchFetchedMap.has(id)) {
			// console.log('Missing this id:', id);
			this.idsToFetchFetchedMap.set(id, false);
		}
		const newIdsToFetch = Array.from(this.idsToFetchFetchedMap.entries())
			.filter(([, value]) => {
				return value == false;
			})
			.map(([key]) => key);
		if (!isEqual(newIdsToFetch, this._entityFileIdsToFetch$$.value)) this._entityFileIdsToFetch$$.next(newIdsToFetch);
	}

	// ----------------//
	//      PDF        //
	// ----------------//

	public generatePdf(data: DataToPDF) {
		return this._restService.postForBlob('/files/generate-pdf', JSON.stringify(data));
	}

	// ----------------//
	//      URL        //
	// ----------------//

	/**
	 * Convert a file ID to its URL using the urls properties and the kind of the file.
	 * If it's an audio files: there is a specific preference order. If it's something else then we use the original file.
	 * @param fileId
	 * @returns
	 */
	public convertEntityFileIdToUrl$(fileId: string | undefined): Observable<string | undefined> {
		return fileId ? this.get$(fileId).pipe(map((file) => convertEntityFileToUrl(file))) : of(undefined);
	}

	public convertRSurlToUrl$(url: string | undefined): Observable<string | undefined> {
		if (!url) return of(undefined);
		if (url.startsWith('rs://')) {
			const entityFileId = url.substring(5);
			return this.convertEntityFileIdToUrl$(entityFileId);
		} else {
			return of(url);
		}
	}

	/**
	 * Convert an URL to an entityFile$
	 * If the URL is not starting with `rs://` result will be `of(undefined)`
	 * @param url
	 * @returns
	 */
	public convertRSurlToEntityFile$(url: string | undefined): Observable<EntityFile | undefined> {
		if (!url) return of(undefined);
		if (url.startsWith('rs://')) {
			const entityFileId = url.substring(5);
			return this.get$(entityFileId);
		} else {
			return of(undefined);
		}
	}
	public convertRSurlToEntityFile(url: string | undefined): EntityFile | undefined {
		if (!url) return undefined;
		if (url.startsWith('rs://')) {
			const entityFileId = url.substring(5);
			return this.get(entityFileId);
		} else {
			return undefined;
		}
	}

	public convertURIToObjectThumbnail(uri: string | undefined): ObjectThumbnail<EntityFile> | undefined {
		if (!uri) return undefined;
		if (uri.startsWith('rs://')) {
			const entityFileId = uri.substring(5);
			const entityFile = this.get(entityFileId);
			return {
				imageUrl: entityFile ? convertEntityFileToUrl(entityFile) : undefined,
				object: this.get(entityFileId),
			};
		} else {
			return {
				imageUrl: uri,
				object: undefined,
			};
		}
	}

	public convertURIToObjectThumbnail$(uri: string | undefined): Observable<ObjectThumbnail<EntityFile> | undefined> {
		console.log({ uri });

		if (!uri) return of(undefined);
		if (uri.startsWith('rs://')) {
			const entityFileId = uri.substring(5);
			return this.get$(entityFileId).pipe(
				map((entityFile) => ({
					imageUrl: entityFile ? convertEntityFileToUrl(entityFile) : undefined,
					object: this.get(entityFileId),
				}))
			);
		} else {
			return of({
				imageUrl: uri,
				object: undefined,
			});
		}
	}

	// -------------------//
	//      DOWNLOAD      //
	// -------------------//
	/**
	 * Save to local file a specific URI under a specific name
	 * @param URI
	 * @param fileName
	 */
	public saveAs(URI: string | Blob, fileName: string) {
		FileSaver.saveAs(URI, fileName);
	}

	// ----------------//
	//      EDIT       //
	// ----------------//
	public addData(entityFileId: string, dataToAdd: NestedPartial<EntityFileData>) {
		const entityFile = this.get(entityFileId);
		if (!entityFile) return;

		const target: EntityFileData = {};
		const currentDataAsStr = entityFile.data;
		const defaultFileData: EntityFileData = {};
		const currentData: EntityFileData = currentDataAsStr ? JSON.parse(currentDataAsStr) : defaultFileData;
		merge(target, currentData, dataToAdd);
		this.updateEntityFile(entityFileId, {
			data: JSON.stringify(target),
		});
	}

	// ----------------------------//
	//      VIRTUAL PLAYLIST       //
	// ----------------------------//

	public convertFileIdToVirtualTrack(
		fileId: string,
		virtualPlaylistId?: string,
		canEditTranscript: boolean = false
	): VirtualTrack | null {
		const virtualPlaylistIdToUse = virtualPlaylistId ?? uuidv4();
		const entityFile = this.get(fileId);
		if (!entityFile) return null;
		const fileOwner = this._usersRepository.get(entityFile.ownerId);
		const userAvatar = fileOwner ? this._usersRepository.getUserAvatar(fileOwner) : null;
		const virtualTrack: VirtualTrack = {
			id: virtualPlaylistIdToUse + '-0',
			active: true,
			files: [
				{
					fileId,
					fileSrc: convertEntityFileToUrl(entityFile),
					fileSynced: entityFile?.fileOnServer,
					mediaType: entityFile.kind == 'video' ? 'video' : 'audio',
				},
			],
			transcript: {
				canEditTranscript,
				originalTranscript: getTranscriptFromData(entityFile),
				editedTranscript: getTranscriptFromData(entityFile, 'edited_manual'),
			},
			source: {
				id: fileId,
				kind: 'file',
			},
			details: {
				title: entityFile.publicName ?? entityFile.fileName,
				description: fileOwner?.fullName,
				pictureSrcs: userAvatar ? [userAvatar] : [],
			},
		};

		return virtualTrack;
	}

	/**
	 * same as convertFileIdToVirtualTrack but reacts to file$ changes
	 * @param fileId
	 * @param virtualPlaylistId
	 * @param canEditTranscript
	 * @returns
	 */
	public convertFileIdToVirtualTrack$(fileId: string, virtualPlaylistId?: string, canEditTranscript: boolean = false) {
		return this.get$(fileId)
			.pipe(startWith(undefined))
			.pipe(
				map(() => {
					return this.convertFileIdToVirtualTrack(fileId, virtualPlaylistId, canEditTranscript);
				})
			);
	}

	public convertFileIdToVirtualPlaylist(
		fileId: string,
		virtualPlaylistId?: string,
		canEditTranscript = false
	): VirtualPlaylist | null {
		const virtualPlaylistIdToUse = virtualPlaylistId ?? uuidv4();
		const entityFile = this.get(fileId);
		if (!entityFile) return null;
		const virtualTrack: VirtualTrack | null = this.convertFileIdToVirtualTrack(
			fileId,
			virtualPlaylistIdToUse,
			canEditTranscript
		);
		if (!virtualTrack) return null;

		const virtualPlaylist: VirtualPlaylist = {
			id: virtualPlaylistIdToUse,
			virtualTracks: [virtualTrack],
			source: {
				id: fileId,
				kind: 'file',
			},
			details: virtualTrack.details,
			transcript: {
				canEditTranscript,
				originalTranscript: getTranscriptFromData(entityFile),
				editedTranscript: getTranscriptFromData(entityFile, 'edited_manual'),
			},
		};
		return virtualPlaylist;
	}

	// TAGS

	public getAllCustomFiletags$(): Observable<Filetag[]> {
		console.warn('[NOT IMPLEMENTED] This function should be in the filetag repository');
		// this function should loop over all files to get available tags
		// we may need the synced version
		return of([]);
	}
	public updateFileTags(entityFile: EntityFile, filetags: Filetag[]) {
		console.error('[filesRepo](updateFileTags$) not implemented');
	}
}
