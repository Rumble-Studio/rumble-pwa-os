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
	selectMany,
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
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityExport } from '@rumble-pwa/exports/models';
import { ObjectAttribute, ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { RestService } from '@rumble-pwa/requests';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { TasksManagementService } from '@rumble-pwa/tasks-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { prepEntityForCreation, prepEntityForRefresh, prepEntityForUpdate, toHoursMinutesSeconds } from '@rumble-pwa/utils';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, map, shareReplay, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const storeName = 'entityExports';
const storePropsName = 'entityExportProps';

export interface EntityExportUI {
	id: EntityExport['id'];
}
export interface EntityExportProps {
	data: string | null | undefined;
}

export const DEFAULT_EXPORT_PROPS: EntityExportProps = {
	data: undefined,
};

export const ENTITY_EXPORT_PROPS_PIPES = propsFactory(storePropsName, { initialValue: DEFAULT_EXPORT_PROPS });

@Injectable({ providedIn: 'root' })
export class ExportsRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public entityExports$: Observable<EntityExport[]>;
	private _entityExportsToSync$: Observable<EntityExport[]>;
	public entityExportUIs$: Observable<EntityExportUI[]>;
	public activeEntityExports$: Observable<EntityExport[]>;
	public activeEntityExport$: Observable<EntityExport | undefined>;
	public entityExportProps$: Observable<EntityExportProps>;

	// private _persist;
	private _store$$;

	constructor(
		private _usersRepository: UsersRepository,
		private _restService: RestService,
		private _tasksManagementService: TasksManagementService,
		private _notificationsService: NotificationsService,
		private _objectPromptService: ObjectPromptService,
		private _subscriptionsManagementService: SubscriptionsManagementService
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		// this._persist = persistState(this._store$$, {
		// 	key: storeName,
		// 	storage: localStorageStrategy,
		// });
		this.entityExports$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.entityExportUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeEntityExport$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeEntityExports$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.entityExportProps$ = this._store$$.pipe(ENTITY_EXPORT_PROPS_PIPES.selectEntityExportProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		// fetch data or clear data based on logged in status
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.fetchFromServer(true);
			} else {
				this._store$$.reset();
			}
		});

		// Instantiate exportsToSyncs$
		this._entityExportsToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);

		// Sync exports
		this._entityExportsToSync$.pipe(debounceTime(500)).subscribe((entityExportsToSync) => {
			entityExportsToSync.forEach((e) => {
				if (e?.operation === 'creation') {
					this._postToServer(e);
				} else if (e?.operation === 'update') this._putToServer(e);
			});
		});
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(entityExport: EntityExport) {
		return this._restService
			.post<EntityExport>('/exports', entityExport)
			.pipe(
				tap((r) => {
					this._refreshEntityExport(r);
				})
			)
			.subscribe();
	}

	private _putToServer(entityExport: EntityExport) {
		return this._restService
			.put<EntityExport>('/exports/' + entityExport.id, entityExport)
			.pipe(
				tap((r) => {
					this._refreshEntityExport(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<EntityExport[]>('/exports')
			.pipe(
				tap((entityExports) => {
					if (replace) {
						this._store$$.update(upsertEntities(entityExports));
					} else {
						entityExports.forEach((entityExport) => {
							this._refreshEntityExport(entityExport);
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
	 * Replace current export with the provided export
	 * @param entityExports
	 */
	setExports(entityExports: EntityExport[]) {
		this._store$$.update(setEntities(entityExports));
	}

	/**
	 * Add a new export to the collection
	 * @param entityExport
	 */
	addEntityExport(entityExport: EntityExport) {
		const syncableEntityExport = prepEntityForCreation<EntityExport>(entityExport);
		this._store$$.update(addEntities(syncableEntityExport));
	}

	/**
	 * Archive an export
	 * @param entityExportId
	 */
	public archive(entityExportId: string) {
		// this.updateEntityExport(entityExportId, { state: 'archived' });
	}

	/**
	 * Delete an export
	 * @param entityExportId
	 */
	public delete(entityExportId: string) {
		// this.updateEntityExport(entityExportId, { state: 'deleted' });
	}

	/**
	 * restore an export
	 * @param entityExportId
	 */
	public restore(entityExportId: string) {
		// this.updateEntityExport(entityExportId, { state: 'default' });
	}

	/**
	 * Update an existing export in the collection
	 * @param id
	 * @param entityExportUpdate (partial)
	 */
	updateEntityExport(id: EntityExport['id'], entityExportUpdate: Partial<EntityExport>) {
		const idToUse = id ?? entityExportUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update export without an id');
		}

		const previousEntityExport = this._store$$.query(getEntity(idToUse));
		if (!previousEntityExport) {
			throw new Error(`Export with id ${idToUse} not found`);
		}
		const updatedEntityExport: EntityExport = {
			...previousEntityExport,
			...entityExportUpdate,
		};
		const syncableEntityExport = prepEntityForUpdate<EntityExport>(updatedEntityExport, previousEntityExport);
		this._store$$.update(updateEntities(idToUse, syncableEntityExport));
		this._store$$.update(updateEntities(id, entityExportUpdate));
	}

	/**
	 * Upsert an entity (creates it if missing) respecting elfSyncable concept
	 * @param entityExport
	 */
	public upsertEntityExport(entityExport: EntityExport) {
		const previousEntityExport = this._store$$.query(getEntity(entityExport.id));
		if (previousEntityExport) {
			this.updateEntityExport(entityExport.id, entityExport);
		} else {
			this.addEntityExport(entityExport);
		}
	}

	private _refreshEntityExport(entityExport: EntityExport) {
		const previousEntityExport = this._store$$.query(getEntity(entityExport.id));
		const syncableEntityExport = prepEntityForRefresh<EntityExport>(entityExport, previousEntityExport);
		this._store$$.update(upsertEntities([syncableEntityExport]));
	}

	/**
	 * Subscribe to an entityExport
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<EntityExport | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public getAll$(): Observable<EntityExport[] | undefined> {
		return this._store$$.pipe(selectAllEntities());
	}

	public get(id: string): EntityExport | undefined {
		return this._store$$.query(getEntity(id));
	}

	public getAll(): EntityExport[] {
		return this._store$$.query(getAllEntities());
	}

	public selectManyByIds$(collectionIds: string[]): Observable<EntityExport[]> {
		return this._store$$.pipe(selectMany(collectionIds));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	setActiveId(id: EntityExport['id']) {
		this._store$$.update(setActiveId(id));
	}

	toggleActiveIds(ids: Array<EntityExport['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setCollectionProps(entityExportProps: Partial<EntityExportProps>) {
		this._store$$.update(ENTITY_EXPORT_PROPS_PIPES.updateEntityExportProps(entityExportProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//
	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<EntityExport>(),
			withUIEntities<EntityExportUI>(),
			ENTITY_EXPORT_PROPS_PIPES.withEntityExportProps(),
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

	public getExportEntitiesByMixId$(mixId: string) {
		return this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (entityExport) =>
					entityExport.mixId === mixId && ['deleted', 'archived'].indexOf(entityExport.state || 'default') == -1,
			})
		);
	}

	public getExportEntitiesByMixId(mixId: string) {
		return this.getAll().filter((e) => e.mixId === mixId && ['deleted', 'archived'].indexOf(e.state || 'default') == -1);
	}

	public addWithCheck(entityExport: EntityExport) {
		const now = Math.round(Date.now() / 1000);
		const newSyncableEntity: EntityExport = {
			timeCreation: now,
			...entityExport,
		};

		this._restService
			.post<EntityExport | undefined>('/exports', newSyncableEntity)
			.pipe(
				tap((entityExportResponse) => {
					if (entityExportResponse) {
						this.upsertEntityExport({ ...entityExportResponse, operation: 'refresh' });
						if (entityExportResponse.taskId)
							this._tasksManagementService.pullTaskByIdOnce(entityExportResponse.taskId);
					}
				}),
				catchError((err) => {
					console.log({ err });

					this._notificationsService.warning(
						err.error?.detail ?? 'An error occured during the operation.',
						undefined,
						undefined,
						undefined,
						20000
					);
					return of();
				})
			)
			.subscribe();
	}

	public getExportsByFileId$(fileId: string): Observable<EntityExport[]> {
		return this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (entityExport) => entityExport.fileId === fileId,
			})
		);
	}

	// public exportFile(entityFile: EntityFile) {
	// 	this.openExportFilePrompt(entityFile.id, entityFile.duration ?? 0)
	// 		.pipe(take(1))
	// 		.subscribe();
	// }

	// public exportFile$(entityFile: EntityFile) {
	// 	return this.openExportFilePrompt(entityFile.id, entityFile.duration);
	// }

	public openExportFilePrompt(
		fileId?: string,
		duration?: number,
		options?: {
			entityExport?: EntityExport;
			modalTitle?: string;
			modalDescription?: string;
			modalSubmitText?: string;
		}
	): Observable<EntityExport | undefined> {
		if (!options?.entityExport && !duration) {
			// TODO notification service this file can't be exported because there's no duration
			return of(undefined);
		}

		const attributeToAdd: ObjectAttribute<EntityExport>[] = [];

		if (duration) {
			const subscriptionIdAttribute: ObjectAttribute<EntityExport> = {
				name: 'subscriptionId',
				HTMLlabel: 'Subscription',
				HTMLhint: toHoursMinutesSeconds(duration, ['showUnits']) + ' will be counted toward your subscription quota.',
				attributeType: 'select',
				required: true,
				// disabled: options?.brand?.ownerId !== this._usersRepository.connectedUser$$.value?.id,
				extra: {
					options: this._subscriptionsManagementService.getAll().map((subscription) => {
						const displayedSubscriptionName =
							(subscription.name ?? subscription.id.substring(0, 8)) +
							'  ( exported time: ' +
							toHoursMinutesSeconds(subscription.durationExported ?? 0, ['showUnits']) +
							'/' +
							toHoursMinutesSeconds(subscription.maxDurationExported ?? 0, ['showUnits']) +
							' )';

						return {
							name: displayedSubscriptionName,
							value: subscription.id,
							disabled: (subscription.durationExported ?? 0) >= (subscription.maxDurationExported ?? 0),
						};
					}),
				},
				defaultValue: this._subscriptionsManagementService
					.getAll()
					.find((subscription) => (subscription.durationExported ?? 0) < (subscription.maxDurationExported ?? 0))?.id,
			};
			attributeToAdd.push(subscriptionIdAttribute);
		}

		return this._objectPromptService
			.openObjectPromptModal$<EntityExport>({
				modalTitle: options?.modalTitle ?? 'Export your file',
				modalDescription:
					options?.modalDescription ??
					'Mark this file as exported to be able to use it as an item and/or to download it. <br> Your export quota will only be charged this month but your file will always be available after that.',
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.entityExport?.id,
				object: options?.entityExport,
				attributes: [
					{
						name: 'name',
						HTMLlabel: 'Export name',
						placeholder: 'My export of the day',
						HTMLhint: 'This name will help you remember why you made this export.',
						defaultValue: '',
						required: true,
					},
					...(!options?.entityExport ? [...attributeToAdd] : []),
				],
			})
			.pipe(
				map((result: Partial<EntityExport> | undefined) => {
					if (!result) return;
					if (options?.entityExport) {
						this.updateEntityExport(options.entityExport.id, { name: result.name });
						const updateEntityExport: EntityExport = {
							...options.entityExport,
							name: result.name,
						};
						return updateEntityExport;
					}
					const id = uuidv4();
					const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
					if (!ownerId) return undefined;

					const newEntityExport: EntityExport = {
						name: result.name,
						id,
						ownerId,
						fileId,
						subscriptionId: result.subscriptionId,
						data: '',
					};

					this.addWithCheck(newEntityExport);
					return newEntityExport;
				})
			);
	}
}
