import { Injectable } from '@angular/core';
import { createStore, propsFactory } from '@ngneat/elf';
import {
	addEntities,
	getAllEntities,
	getAllEntitiesApply,
	getEntity,
	selectActiveEntities,
	selectActiveEntity,
	selectAllEntities,
	selectEntity,
	setActiveId,
	setEntities,
	toggleActiveIds,
	UIEntitiesRef,
	updateEntities,
	withActiveId,
	withActiveIds,
	withEntities,
	withUIEntities,
} from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityFile, Filetag } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { flatten, sortBy } from 'lodash';
import { combineLatest, Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const storeName = 'filetags';
const storePropsName = 'filetagProps';

export interface FiletagUI {
	id: Filetag['id'];
}
export interface FiletagProps {
	something?: string;
}

export const DEFAULT_FILETAG_PROPS: FiletagProps = {
	something: '',
};

export const BRAND_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_FILETAG_PROPS,
});

// CUSTOM INTERFACE AND CONST
// (empty)

@Injectable({ providedIn: 'root' })
export class FiletagsRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public filetags$: Observable<Filetag[]>;
	public filetagUIs$: Observable<FiletagUI[]>;
	public activefiletags$: Observable<Filetag[]>;
	public activeFiletag$: Observable<Filetag | undefined>;
	public filetagProps$: Observable<FiletagProps>;

	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	//(empty)

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

		private _filesRepository: FilesRepository,
		private _notificationsService: NotificationsService, // private _usersRepository: UsersRepository, // private _authService: AuthService // to avoid fetch request when logged out
		private _usersRepository: UsersRepository // for store clearing when logged out
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.filetags$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.filetagUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeFiletag$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activefiletags$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.filetagProps$ = this._store$$.pipe(BRAND_PROPS_PIPES.selectFiletagProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		// fetch data or clear data based on logged in status
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				// this.fetchFromServer(true);
			} else {
				this._store$$.reset();
			}
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// Get all filetags from entityFiles
		this._filesRepository.accessibleEntityFiles$
			.pipe(
				tap((entityFiles) => {
					const availableFiletags = flatten(entityFiles.map((entityFile) => entityFile.filetags ?? []));
					const availableFiletagsUnique = [
						...new Map(
							availableFiletags.map((availableFiletag) => [availableFiletag['id'], availableFiletag])
						).values(),
					];
					this.setFiletags(availableFiletagsUnique);
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	// (empty)

	// ---------------------------------------------------//
	//                                                    //
	//                   ENTITY METHODS                   //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Replace current collection with the provided collection
	 * @param filetags
	 */
	public setFiletags(filetags: Filetag[]) {
		this._store$$.update(setEntities(filetags));
	}

	/**
	 * Add a new filetag to the collection
	 * @param filetag
	 */
	public addFiletag(filetag: Filetag) {
		this._store$$.update(addEntities(filetag));
	}

	/**
	 * Update an existing filetag in the collection
	 * @param id
	 * @param filetagUpdate (partial)
	 */
	public updateFiletag(id: Filetag['id'] | undefined, filetagUpdate: Partial<Filetag>) {
		const idToUse = id ?? filetagUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update filetag without an id');
		}

		const previousFiletag = this._store$$.query(getEntity(idToUse));
		if (!previousFiletag) {
			throw new Error(`Filetag with id ${idToUse} not found`);
		}
		const updatedFiletag: Filetag = {
			...previousFiletag,
			...filetagUpdate,
		};
		this._store$$.update(updateEntities(idToUse, updatedFiletag));
	}

	/**
	 * Subscribe to a filetag
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<Filetag | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string): Filetag | undefined {
		return this._store$$.query(getEntity(id));
	}

	public getAll(): Filetag[] {
		return this._store$$.query(getAllEntities());
	}

	public getCustomTagByValue(tagValue: string) {
		return this._store$$.query(
			getAllEntitiesApply({
				filterEntity: (tag) => tag.value === tagValue && tag.kind === 'custom',
			})
		);
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	public setActiveId(id: Filetag['id']) {
		this._store$$.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<Filetag['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setFiletagProps(filetagProps: Partial<FiletagProps>) {
		this._store$$.update(BRAND_PROPS_PIPES.updateFiletagProps(filetagProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Filetag>(),
			withUIEntities<FiletagUI>(),
			BRAND_PROPS_PIPES.withFiletagProps(),
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

	// /**
	//  * Open the object prompt to edit the filetag
	//  */
	public openPromptEditor(options?: {
		fileId: string;
		file?: EntityFile[];
		modalTitle?: string;
		modalSubmitText?: string;
		canEditSharedGroups?: boolean;
	}): Observable<Filetag[] | undefined> {
		type ExtendedFiletag = Partial<Filetag> & {
			tags?: string[];
		};

		const currentFiletagsValue: string[] = [];

		if (options?.fileId) {
			const file: EntityFile | undefined = this._filesRepository.get(options.fileId);
			const filetags = file?.filetags ?? [];
			const filetagsValues = filetags
				.filter((filetag) => filetag.kind === 'custom')
				.map((filetag) => filetag.value)
				.filter((filetagValue): filetagValue is string => !!filetagValue);
			currentFiletagsValue.push(...filetagsValues);
		}

		// Get all custom tags
		const availableFiletags = this.getAll().filter((availableFiletag) => availableFiletag.kind === 'custom');
		const availableFiletagsValue: string[] = availableFiletags
			.map((filetag) => filetag.value)
			.filter((filetagValue): filetagValue is string => !!filetagValue);

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedFiletag>({
				modalTitle: options?.modalTitle ?? 'Edit your tags',
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.fileId,
				attributes: [
					{
						name: 'tags',
						HTMLlabel: 'Tags',
						attributeType: 'text-list-control',
						defaultValue: [...currentFiletagsValue],
						placeholder: 'New tag...',
						extra: {
							chipOptions: availableFiletagsValue,
							chipStyle: 'tag',
						},
					},
				],
			})
			.pipe(
				switchMap((result: Partial<ExtendedFiletag> | undefined) => {
					if (!result) return of(undefined);

					const filetagsToCreate: string[] =
						result.tags?.filter((tag) => ![...availableFiletagsValue, ...currentFiletagsValue].includes(tag)) ?? [];
					const filetagsToAdd: string[] =
						result.tags?.filter(
							(tag) => !currentFiletagsValue.includes(tag) && availableFiletagsValue.includes(tag)
						) ?? [];
					const filetagsToRemove: string[] = currentFiletagsValue.filter((tag) => !result.tags?.includes(tag));
					const filetagsToToggle: string[] = [...filetagsToAdd, ...filetagsToRemove];

					if (options?.fileId) {
						filetagsToToggle.forEach((filetagToToggle) => {
							const matchFiletag = availableFiletags.find(
								(availableFiletag) => availableFiletag.value === filetagToToggle
							);
							if (!matchFiletag) return;
							this.toggleFiletag(options.fileId, matchFiletag.id);
						});
					}

					const filetagsToCreate$: Observable<Filetag>[] = filetagsToCreate.map((filetagToCreate) => {
						const newTag: Filetag = {
							id: uuidv4(),
							kind: 'custom',
							value: filetagToCreate,
						};
						return this.createFiletag$(newTag);
					});

					return combineLatest(filetagsToCreate$);
				}),
				map((createdFiletags) => {
					if (!createdFiletags) return;
					if (options?.fileId) {
						createdFiletags.forEach((createdFiletag) => {
							this.toggleFiletag(options.fileId, createdFiletag.id);
						});
					}
					return createdFiletags;
				})
			);
	}

	public toggleFiletag(fileId: string, tagId: string) {
		return this._restService
			.post<EntityFile>('/files/' + fileId + '/toggle-tag/' + tagId, {})
			.pipe(
				tap((fileApi: EntityFile) => {
					this._filesRepository.refreshEntityFile(fileApi);
				}),
				catchError((error) => {
					this._notificationsService.error(error.message);
					return throwError(error);
				})
			)
			.subscribe();
	}

	public createFiletag$(tag: Filetag) {
		return this._restService.post<Filetag>('/tags', tag).pipe(
			catchError((error) => {
				this._notificationsService.error(error.message);
				return throwError(error);
			})
		);
	}
}
