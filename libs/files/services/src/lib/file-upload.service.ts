import { HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FileTableComponent } from '@rumble-pwa/files/display';
import {
	convertEntityFileToUrl,
	convertKindsToAcceptedExtensions,
	convertMacroKindsToAcceptedExtensionsString,
	EntityFile,
	MacroFileKindDefined,
} from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import {
	convertFileToFileWithData,
	FileWithData,
	FILE_MAX_PREVIEW_SIZE_MB,
	ObjectPromptService,
} from '@rumble-pwa/objects/prompt';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Bss$$, computeChecksumMd5$, ConnectionStateService, intervalBackoff } from '@rumble-pwa/utils';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { ExistingOrUploadPromptComponent } from './existing-or-upload-prompt/existing-or-upload.prompt.component';
import { GcpUploadService } from './gcp-upload.service';

export enum UploadingState {
	START_0 = 'Ready for upload',
	HASHING_1 = 'Preparing file for upload...', // 'Hashing file on client...',
	HASHED_2 = 'File is ready for upload.', //Hashing file on client...Done.',
	ENTITY_CREATION_3 = 'Preparing file data...', // 'Creating entity file object...',
	ENTITY_IN_STORE_4 = 'File data ready.', //'Creating entity file object...Done.', // in store
	ENTITY_SYNCING_5 = 'Saving file data...', // syncing to server
	ENTITY_SYNCED_6 = 'File data saved.', // synced
	REQUESTING_PUT_URL_7 = 'Connecting to storage...',
	PUT_URL_RECEIVED_8 = 'Connected with storage.',
	UPLOADING_9 = 'Uploading file...',
	UPLOADED_10 = 'File uploaded.',
	ENTITY_REQUEST_UPDATE_AFTER_UPLOAD_11 = 'Refreshing local data', //Updating entity file object...',
	ENTITY_UPDATED_AFTER_UPLOAD_12 = 'Local data up-to-date.', //Updating entity file object...Done.',
	BACKGROUND_JOB_REQUEST_13 = 'Waiting for background tasks status...', //Requesting background job...',
	BACKGROUND_JOB_REQUESTED_14 = 'Background tasks still running...',
	BACKGROUND_JOB_FINISHED_15 = 'Background tasks are over.',
	PROCESSUS_OVER_16 = 'File is saved.',
}

export interface UploadableFile {
	identifier: string;
	file: File;
	kind?: MacroFileKindDefined;
	ownerId: string;
	publicName?: string;

	entityFile?: EntityFile;
	putUrl?: string;

	state: UploadingState;
	progress: number;
	error?: string;
	trials: number;

	fileAsStr?: string; // can be used to store the file as a string and recover from a refresh if File is lost
}

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class FileUploadService {
	isUploadCapable$$ = new BehaviorSubject(false);

	// filesToUpload$$$ = new Bss$$<string[]>();
	uploadableFilesMap = new Map<string, Bss$$<UploadableFile>>();
	newUploadableFileEvent$$ = new Subject<string>();

	constructor(
		private _filesRepository: FilesRepository,
		private _gcpUploadService: GcpUploadService,
		private _restService: RestService,
		private _connectionStateService: ConnectionStateService,
		private _objectPromptService: ObjectPromptService,
		private _dialog: MatDialog,
		private _usersRepository: UsersRepository
	) {
		// this.testUploadCapability()
		// 	.pipe(
		// 		take(1),
		// 		tap((isUploadCapable) => {
		// 			console.log('%c(testUploadCapability)', 'color:DarkBlue; font-weight: bold;', isUploadCapable);
		// 		})
		// 	)
		// 	.subscribe(this.isUploadCapable$$);
		/** steps:
		 * 1. create shell entityFile for connected user
		 * 2. sync the entityFile
		 * 3. get the resumable upload url
		 * 4. upload the file
		 * 5. sync the entityFile
		 *
		 * */
	}

	// testUploadCapability() {
	// 	const testId = uuidv4();

	// 	const isLoggedIn$$ = this._usersRepository.isConnected$$;

	// 	const fileCreated$$ = new BehaviorSubject<boolean>(false);

	// 	const connected$: Observable<boolean> = this.connectionStateService.connected$;

	// 	let uploadCapable: boolean | undefined = undefined;

	// 	const connectedForEnoughTime$ = combineLatest([connected$, isLoggedIn$$]).pipe(
	// 		debounceTime(5000),
	// 		map(([connected, isLoggedIn]) => connected && isLoggedIn),
	// 		filter((connectedAndLoggedIn) => connectedAndLoggedIn),
	// 		startWith(false)
	// 	);

	// 	const userId$: Observable<string | undefined> = this.profileQuery.profile$.pipe(
	// 		filter((profile) => !!profile),
	// 		map((profile) => profile?.id)
	// 	);
	// 	const fileId$: Observable<string | undefined> = userId$.pipe(
	// 		map((userId) => (userId ? 'test-upload-' + userId : undefined)),
	// 		shareReplay()
	// 	);
	// 	const entityFile$: Observable<EntityFile | undefined> = fileId$.pipe(
	// 		switchMap((fileId) => (fileId ? this.get$(fileId) : of(undefined))),
	// 		shareReplay()
	// 	);
	// 	const fileSynced$: Observable<boolean> = entityFile$.pipe(
	// 		map(
	// 			(entityFile) =>
	// 				entityFile?.fileOnServer === true && entityFile?.toSync === false && entityFile?.publicName === testId
	// 		),
	// 		filter((synced) => synced != uploadCapable),
	// 		tap((synced) => (uploadCapable = synced)),
	// 		shareReplay()
	// 	);

	// 	// remove file if not good test id
	// 	combineLatest([entityFile$, connected$, isLoggedIn$$])
	// 		.pipe(
	// 			filter(([entityFile, connected, isLoggedIn]) => connected && !!entityFile && isLoggedIn),
	// 			switchMap(([entityFile, connected, isLoggedIn]) => {
	// 				if (entityFile && entityFile.publicName !== testId && connected && isLoggedIn) {
	// 					// remove remotely first then locally
	// 					return this.restService.delete('/files/delete-test-upload-file/').pipe(
	// 						tap(() => {
	// 							this.removeFromStore(entityFile.id);
	// 						})
	// 					);
	// 				}
	// 				return of(undefined);
	// 			})
	// 		)
	// 		.subscribe();

	// 	// create file if needed
	// 	combineLatest([connected$, userId$, fileId$, entityFile$, fileCreated$$, isLoggedIn$$])
	// 		.pipe(
	// 			debounceTime(100),
	// 			filter(
	// 				([connected, userId, fileId, entityFile, fileCreated, isLoggedIn]) =>
	// 					connected && !!userId && !!fileId && !entityFile && !fileCreated && isLoggedIn
	// 			),
	// 			tap(([, , fileId, ,]) => {
	// 				const file = new File(['upload-test-file'], 'testUpload.json', {
	// 					type: 'application/json',
	// 				});
	// 				this.saveFileAllowedV2(file, 'test-upload', TYPE_CLIENT_ENUM.ANYTHING, ['json'], testId, fileId);
	// 			})
	// 		)
	// 		.subscribe();

	// 	return combineLatest([fileSynced$, connectedForEnoughTime$]).pipe(
	// 		filter(([fileSynced, connectedForEnoughTime]) => connectedForEnoughTime || fileSynced),
	// 		map(([fileSynced]) => fileSynced)
	// 	);
	// }

	pleaseUploadThisFile$(file: File, ownerId: string, identifier: string, publicName?: string, kind?: MacroFileKindDefined) {
		const initialUploadableFile: UploadableFile = {
			identifier,
			file,
			ownerId,
			publicName,
			entityFile: undefined,
			putUrl: undefined,
			state: UploadingState.START_0,
			trials: 0,
			progress: 0,
			kind,
		};
		const bss$$ = new Bss$$<UploadableFile>(initialUploadableFile);
		this.uploadableFilesMap.set(identifier, bss$$);
		this.newUploadableFileEvent$$.next(identifier);
		return this._processThisFile$(bss$$);
	}

	private _processThisFile$(bss$$: Bss$$<UploadableFile>) {
		const hasher$ = bss$$.$$.pipe(
			filter((uploadableFile) => uploadableFile.state === UploadingState.START_0),
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.HASHING_1 };
			}),
			switchMap((uploadableFile) => {
				return computeChecksumMd5$(uploadableFile.file);
			}),
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.HASHED_2 };
			})
		);
		const entityFileCreation$ = hasher$.pipe(
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.ENTITY_CREATION_3 };
			}),
			map((checksum) => {
				const entityFile: EntityFile = {
					id: uuidv4(),
					ownerId: bss$$.value.ownerId,
					publicName: bss$$.value.publicName,
					fileName: bss$$.value.file.name,
					fileHashClient: checksum,
					kind: bss$$.value.kind,
				};

				return entityFile;
			}),
			switchMap((entityFile) => {
				this._filesRepository.addEntityFile(entityFile);
				return this._filesRepository.get$(entityFile.id, false);
			}),
			filter((entityFile): entityFile is EntityFile => !!entityFile),
			take(1),
			tap((entityFile) => {
				bss$$.value = { ...bss$$.value, state: UploadingState.ENTITY_IN_STORE_4, entityFile };
			}),
			shareReplay()
		);

		const reader$ = entityFileCreation$.pipe(
			take(1),
			tap(async (entityFile) => {
				if (bss$$.value.file.size < FILE_MAX_PREVIEW_SIZE_MB * 1024 * 1024) {
					// console.log('Reading file with text() method');

					// const fileAsStr = await bss$$.value.file.text();
					// bss$$.value = { ...bss$$.value, fileAsStr };
					// this._filesRepository.updateEntityFile(entityFile.id, { fileAsStr });
					const reader = new FileReader();
					reader.onload = (e) => {
						// const result = this.sanitizer.bypassSecurityTrustUrl(
						//   e.target?.result as string
						// ) as string;
						const fileAsStr = e.target?.result as string;
						bss$$.value = { ...bss$$.value, fileAsStr };
						// this._filesRepository.updateEntityFile(entityFile.id, { fileAsStr });
					};
					reader.onerror = function (e) {
						console.error('Error (' + e + ') while reading the entity file:', entityFile);
					};
					reader.readAsDataURL(bss$$.value.file);
				} else {
					console.log('File too big for preview', bss$$.value.file.name, bss$$.value.file.size);
				}
			})
		);
		reader$.subscribe();

		const entityFileSyncing$ = entityFileCreation$.pipe(
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.ENTITY_SYNCING_5 };
			}),
			switchMap((entityFile) => this._filesRepository.get$(entityFile.id, false)),
			filter((entityFile): entityFile is EntityFile => !!entityFile && entityFile.toSync === false),
			take(1),
			tap((entityFile) => {
				bss$$.value = { ...bss$$.value, state: UploadingState.ENTITY_SYNCED_6, entityFile };
			})
		);

		const putUrl$ = combineLatest([this._connectionStateService.connectedSubject$$, entityFileSyncing$]).pipe(
			filter(([connected]) => connected),
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.REQUESTING_PUT_URL_7 };
			}),
			switchMap(([, entityFile]) => {
				return this._gcpUploadService.getResumableUploadUrl$(entityFile.id, bss$$.value.file.type);
			}),
			take(1),
			tap((putUrl) => {
				bss$$.value = { ...bss$$.value, state: UploadingState.PUT_URL_RECEIVED_8, putUrl };
			})
		);

		const progress$ = putUrl$.pipe(
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.UPLOADING_9 };
			}),
			switchMap((putUrl) => {
				return this._gcpUploadService.uploadFileToUrl$(putUrl, bss$$.value.file, (progress) => {
					bss$$.value = { ...bss$$.value, progress: Math.round(progress * 100) };
				});
			}),
			filter((event) => event.type === HttpEventType.Response),
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, progress: 100, state: UploadingState.UPLOADED_10 };
			})
		);

		const entityFileRequestUpdateAfterUpload$ = combineLatest([bss$$.$$, progress$]).pipe(
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.ENTITY_REQUEST_UPDATE_AFTER_UPLOAD_11 };
			}),
			switchMap(([uploadableFile]) => {
				if (!uploadableFile.entityFile) {
					throw new Error('This should not happen');
				}
				return this._restService.get<EntityFile>('/files/' + uploadableFile.entityFile.id + '/update-after-upload');
			}),
			take(1),
			tap((newEntityFile) => {
				this._filesRepository.upsertEntityFile({ ...newEntityFile, operation: 'refresh' });
			}),
			tap((entityFile) => {
				bss$$.value = { ...bss$$.value, state: UploadingState.ENTITY_UPDATED_AFTER_UPLOAD_12, entityFile };
			})
		);

		const watchBackgroundJob$ = entityFileRequestUpdateAfterUpload$.pipe(
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.BACKGROUND_JOB_REQUEST_13 };
			}),
			switchMap(() =>
				intervalBackoff({
					initialInterval: 1000,
					maxInterval: 60000,
				})
			),
			switchMap((backoff) => {
				// console.log('[UploadingService] Background job request:', backoff);
				const entityFileId = bss$$.value.entityFile?.id;
				bss$$.value = { ...bss$$.value, state: UploadingState.BACKGROUND_JOB_REQUESTED_14 };
				return this._restService.get<EntityFile>('/files/' + entityFileId);
			}),
			tap((entityFile) => {
				this._filesRepository.upsertEntityFile({ ...entityFile, operation: 'refresh' });
			}),
			filter((entityFile): entityFile is EntityFile => !!entityFile && !!entityFile.kind && !!entityFile.urls?.original),
			take(1),
			tap((entityFile) => {
				bss$$.value = { ...bss$$.value, state: UploadingState.BACKGROUND_JOB_FINISHED_15, entityFile };
			})
		);

		const final$ = watchBackgroundJob$.pipe(
			take(1),
			tap(() => {
				bss$$.value = { ...bss$$.value, state: UploadingState.PROCESSUS_OVER_16 };
			})
		);

		final$.subscribe();
		return bss$$;
	}

	/**
	 * Open the object prompt to upload some files (or one file)
	 * @param ownerId
	 * @param acceptedKinds
	 * @param options
	 * @param withUrls Filter until all entityFiles have url properties
	 * @returns
	 */
	public uploadNewFiles$(
		ownerId: string,
		maxNumberOfEntityFiles: number,
		acceptedKinds: MacroFileKindDefined[] = ['audio'],
		modalTitle?: string,
		modalSubmitText?: string,
		preExistingFiles?: File[],

		withUrls = false
	) {
		const _acceptedExtensions = convertKindsToAcceptedExtensions(acceptedKinds);
		const _acceptedExtensionsString = convertMacroKindsToAcceptedExtensionsString(acceptedKinds);
		console.log('Accepted kinds:', _acceptedExtensions);

		type UploadFilesResult = {
			filesWithData?: FileWithData[];
		};

		return this._objectPromptService
			.openObjectPromptModal$<UploadFilesResult>(
				//
				{
					modalTitle: modalTitle ?? translate('filesService.fileUpload.Upload a file'),
					modalSubmitText: modalSubmitText ?? 'Upload',
					attributes: [
						{
							name: 'filesWithData',
							HTMLlabel: translate('file'),
							attributeType: 'file',
							multiple: maxNumberOfEntityFiles != 1,
							required: true,
							extra: {
								maxObjectsSelected: maxNumberOfEntityFiles,
								acceptedExtensions: _acceptedExtensions,
								acceptedExtensionsString: _acceptedExtensionsString,
							},
						},
					],
					object: {
						filesWithData: preExistingFiles
							? preExistingFiles
									.map((file) => convertFileToFileWithData(file))
									.filter((fileWithData) =>
										fileWithData.extension ? _acceptedExtensions.includes(fileWithData.extension) : false
									)
							: undefined,
					},
				}
			)
			.pipe(
				switchMap((result: Partial<UploadFilesResult> | undefined) => {
					if (!result) return of(undefined);
					if (!result.filesWithData) return of(undefined);

					console.log({ result });

					return combineLatest(
						result.filesWithData?.map((fileWithData) => {
							return this.pleaseUploadThisFile$(fileWithData.file, ownerId, uuidv4(), fileWithData.publicName).$$;
						})
					).pipe(
						switchMap((uploadableFiles) => {
							console.log({ uploadableFiles });

							return combineLatest(
								uploadableFiles.map((uploadableFile) =>
									uploadableFile.entityFile?.id
										? this._filesRepository.get$(uploadableFile.entityFile.id, false)
										: of(undefined)
								)
							);
						}),
						filter((entityFiles) => {
							const f = entityFiles.every(
								(entityFile) => !!entityFile && (withUrls ? !!convertEntityFileToUrl(entityFile) : true)
							);
							console.log({ entityFiles, f });

							return f;
						}),
						map((entityFiles) => {
							const ef = entityFiles.filter((entityFile): entityFile is EntityFile => !!entityFile);
							console.log({ ef });

							return ef;
						})
					);
				})
			);
	}

	/**
	 * Open the object prompt to select among existing files
	 */
	public selectFromExistingFiles$(
		existingEntityFiles: EntityFile[],
		maxNumberOfEntityFiles: number = -1,
		modalTitle?: string,
		modalSubmitText?: string
	) {
		type SelectEntityFilesResult = {
			entityFilesList?: EntityFile[];
		};

		const multiple = maxNumberOfEntityFiles != 1;

		return this._objectPromptService
			.openObjectPromptModal$<SelectEntityFilesResult>(
				//
				{
					modalTitle: modalTitle ?? 'Select a file',
					modalSubmitText: modalSubmitText ?? 'Done',
					attributes: [
						{
							name: 'entityFilesList',
							attributeType: 'customComponent',
							multiple,
							required: true,
							multipleRange: { min: 1, max: maxNumberOfEntityFiles > 0 ? maxNumberOfEntityFiles : undefined },
							extra: {
								objects: existingEntityFiles,
								maxObjectsSelected: maxNumberOfEntityFiles,
								customComponent: FileTableComponent,
								customPropertiesMapping: {
									files: existingEntityFiles,
									allowSelection: true,
									maxObjectsSelected: maxNumberOfEntityFiles,
								},
							},
						},
					],
				}
			)
			.pipe(
				switchMap((result: Partial<SelectEntityFilesResult> | undefined) => {
					return of(result?.entityFilesList);
				})
			);
	}

	public askUserForEntityFiles$(
		ownerId: string,
		acceptedKinds: MacroFileKindDefined[] = ['audio'],
		maxNumberOfEntityFiles = -1,
		modalTitle?: string,
		modalSubmitText?: string,
		preExistingFiles: File[] = [],
		withUrls = false,
		existingEntityFiles: EntityFile[] = []
	): Observable<EntityFile[] | undefined> {
		console.log('ask user for entity files	', {
			ownerId,
			acceptedKinds,
			maxNumberOfEntityFiles,
			modalTitle,
			modalSubmitText,
			preExistingFiles,
			withUrls,
			existingEntityFiles,
		});

		// directly jump to "client explorer" if no entityFiles provided of if File[] provided
		if (preExistingFiles.length > 0 || existingEntityFiles.length == 0) {
			return this.uploadNewFiles$(
				ownerId,
				maxNumberOfEntityFiles,
				acceptedKinds,
				modalTitle,
				modalSubmitText,
				preExistingFiles,
				withUrls
			);
		}
		const dialogRef = this._dialog.open(ExistingOrUploadPromptComponent);
		return dialogRef.afterClosed().pipe(
			switchMap((choice) => {
				if (choice == 'upload') {
					return this.uploadNewFiles$(
						ownerId,
						maxNumberOfEntityFiles,
						acceptedKinds,
						modalTitle,
						modalSubmitText,
						preExistingFiles,
						withUrls
					);
				} else if (choice == 'existing') {
					return this.selectFromExistingFiles$(
						existingEntityFiles,
						maxNumberOfEntityFiles,
						modalTitle,
						modalSubmitText
					);
				} else return of([]);
			})
		);
	}

	_getNewEntityFiles$(maxNumberOfEntityFiles: number, kind: MacroFileKindDefined, modalTitle: string) {
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return of(null);
		return this._filesRepository.accessibleEntityFiles$.pipe(
			take(1),
			switchMap((accessibleEntityFiles) => {
				const eligibleFiles: EntityFile[] = accessibleEntityFiles.filter((entityFile) => entityFile.kind === kind);
				return this.askUserForEntityFiles$(
					ownerId,
					[kind],
					maxNumberOfEntityFiles,
					modalTitle,
					'Done',
					undefined,
					true,
					eligibleFiles
				);
			}),
			take(1),
			map((entityFiles) => {
				if (entityFiles && entityFiles.length > 0) {
					return entityFiles.map((entityFile) => ({
						imageUrl: convertEntityFileToUrl(entityFile),
						object: entityFile,
					}));
				}
				return null;
			})
		);
	}
	public getNewImages$ = (maxNumberOfEntityFiles: number): Observable<ObjectThumbnail<EntityFile>[] | null> => {
		return this._getNewEntityFiles$(
			maxNumberOfEntityFiles,
			'image',
			maxNumberOfEntityFiles == 1 ? 'Add a new image' : 'Add new images'
		);
	};

	public getNewAudios$ = (maxNumberOfEntityFiles: number): Observable<ObjectThumbnail<EntityFile>[] | null> => {
		return this._getNewEntityFiles$(
			maxNumberOfEntityFiles,
			'audio',
			maxNumberOfEntityFiles == 1 ? 'Add a new audio file' : 'Add new audio files'
		);
	};
}
