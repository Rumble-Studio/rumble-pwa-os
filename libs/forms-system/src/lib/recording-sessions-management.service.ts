import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { selectPersistStateInit } from '@datorama/akita';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { convertEntityFileToUrl, EntityFile, getTranscriptFromData } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { GlobalPlayerService } from '@rumble-pwa/global-player';
import {
	Answer,
	AnswersQuery,
	Form,
	FormsQuery,
	GlobalPlayerServiceSettings,
	Playlist,
	PlaylistsQuery,
	RecordingSession,
	RecordingSessionListItem,
	RecordingSessionsQuery,
	RecordingSessionsService,
	Step,
	StepsQuery,
} from '@rumble-pwa/mega-store';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { FileForVirtualTrack, VirtualPlaylist, VirtualTrack } from '@rumble-pwa/player/services';
import { RestService } from '@rumble-pwa/requests';
import { Track, TracksRepository } from '@rumble-pwa/tracks/state';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Attr, getRouteQueryParam$, NestedPartial } from '@rumble-pwa/utils';
import { flatten, isEqual, sortBy, sum } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, filter, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { AnswersManagementService } from './answers-management.service';
import { FormsManagementService } from './forms-management.service';
import { StepsManagementService } from './steps-management.service';

@Injectable({
	providedIn: 'root',
})
export class RecordingSessionsManagementService {
	recordingSessions$$: BehaviorSubject<RecordingSession[]>;

	public recordingSessionsLoaded$$ = new BehaviorSubject<boolean>(false);

	_debug = false;

	constructor(
		private _restService: RestService,
		private _recordingSessionsService: RecordingSessionsService,
		private _recordingSessionsQuery: RecordingSessionsQuery,
		private _usersRepository: UsersRepository,
		private _notificationsService: NotificationsService,
		private _formsManagementService: FormsManagementService,
		private _stepsManagementService: StepsManagementService,
		private _answersManagementService: AnswersManagementService,
		private _filesRepository: FilesRepository,
		private _playlistsManagementService: PlaylistsManagementService,
		private _tracksRepository: TracksRepository, // needed to preload
		private _formsQuery: FormsQuery,
		private _globalPlayerService: GlobalPlayerService,
		private _playlistsQuery: PlaylistsQuery,
		private _stepsQuery: StepsQuery,
		private _answersQuery: AnswersQuery,
		private _activatedRoute: ActivatedRoute
	) {
		this.recordingSessions$$ = this._recordingSessionsQuery.recordingSessions$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});

		getRouteQueryParam$(this._activatedRoute, 'debug')
			.pipe(
				tap((debug) => {
					this._debug = !!debug;
				})
			)
			.subscribe();
	}

	pullData() {
		// get recordingSessions data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.recordingSessionsLoaded$$.next(false);
				this._restService.get<RecordingSession[]>('/recording-sessions').subscribe((recordingSessionApis) => {
					// console.log('Rec sess from server:', recordingSessionApis);

					// upsert recordingSessions to local store
					this._recordingSessionsService.upsertMany(
						recordingSessionApis.map((recordingSessionApis) => {
							return { ...recordingSessionApis, operation: 'refresh' };
						})
					);
					this.recordingSessionsLoaded$$.next(true);
				});
			} else {
				this.recordingSessionsLoaded$$.next(false);
				this._recordingSessionsService.set([]);
				this.recordingSessionsLoaded$$.next(true);
			}
		});
	}
	pullDataOnce(verbose = false) {
		// get recordingSessions data from server
		this._usersRepository.isConnected$$.pipe(take(1)).subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this._restService.get<RecordingSession[]>('/recording-sessions').subscribe((recordingSessionApis) => {
					// upsert recordingSessions to local store
					this._recordingSessionsService.upsertMany(
						recordingSessionApis.map((recordingSessionApis) => {
							return { ...recordingSessionApis, operation: 'refresh' };
						})
					);
					if (verbose) {
						setTimeout(() => {
							this._notificationsService.success('Recording sessions will refresh soon.');
						}, 1000);
					}
				});
		});
	}

	pushData() {
		this._recordingSessionsQuery.recordingSessionsToSync$.pipe(debounceTime(300)).subscribe((recordingSessions) => {
			recordingSessions.forEach((recordingSession) => {
				if (recordingSession?.operation === 'creation') {
					this._postToServer(recordingSession);
				} else if (recordingSession?.operation === 'update') this._putToServer(recordingSession);
			});
		});
	}

	public add(data: RecordingSession) {
		this._recordingSessionsService.add(data);
	}
	public update(id: string, data: Partial<RecordingSession>) {
		this._recordingSessionsService.update(id, data);
	}
	public upsert(data: RecordingSession) {
		this._recordingSessionsService.upsert(data);
	}
	public removeFromStore(id: string) {
		this._recordingSessionsService.remove(id);
	}
	public delete(id: string) {
		this._recordingSessionsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this._recordingSessionsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this._recordingSessionsService.update(id, { state: 'default' });
	}

	public get(id: string) {
		return this._recordingSessionsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this._recordingSessionsQuery.selectEntity(id);
	}

	//
	// SERVER SYNC
	//
	private _putToServer(recordingSession: RecordingSession) {
		if (!recordingSession.ownerId) this.removeFromStore(recordingSession.id);
		return this._restService
			.put<RecordingSession>('/recording-sessions/' + recordingSession.id, recordingSession)
			.pipe(
				tap((r) => {
					this._recordingSessionsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(recordingSession: RecordingSession) {
		return this._restService
			.post<RecordingSession>('/recording-sessions', recordingSession)
			.pipe(
				tap((r) => {
					this._recordingSessionsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	public getFormSessions$(formId: string, includeArchived = false): Observable<RecordingSession[]> {
		return this._recordingSessionsQuery
			.selectAll({
				filterBy: (entity) =>
					entity.formId === formId &&
					['deleted', ...(includeArchived ? [] : ['archived'])].indexOf(entity.state || 'default') == -1,
			})
			.pipe(map((recordingSessions) => sortBy(recordingSessions, 'timeCreation')));
	}

	public getFormSessionsWArchived$(formId: string): Observable<RecordingSession[]> {
		return this._recordingSessionsQuery
			.selectAll({
				filterBy: (entity) => entity.formId === formId && ['deleted'].indexOf(entity.state || 'default') == -1,
			})
			.pipe(map((recordingSessions) => sortBy(recordingSessions, 'timeCreation')));
	}

	public getFormSessions(formId: string): RecordingSession[] {
		return this._recordingSessionsQuery.getAll({
			filterBy: (entity) => entity.formId === formId && ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getPersonalFormRecordingSessions$(formId: string, userId?: string): Observable<RecordingSession[]> {
		console.log('Getting personal form rec sess $', formId, userId);

		return this._recordingSessionsQuery
			.selectAll({
				filterBy: (entity: RecordingSession) =>
					entity.formId === formId &&
					entity.ownerId === (userId ?? this._usersRepository.connectedUser$$.value?.id) &&
					['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
			})
			.pipe(
				map((recordingSessions) => sortBy(recordingSessions, 'timeCreation')),
				tap((recSes) => console.log({ recSes }))
			);
	}
	public getPersonalFormRecordingSessions(formId: string, userId?: string): RecordingSession[] {
		return sortBy(
			this._recordingSessionsQuery.getAll({
				filterBy: (entity) =>
					entity.formId === formId &&
					entity.ownerId === (userId ?? this._usersRepository.connectedUser$$.value?.id) &&
					['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
			}),
			'timeCreation'
		);
	}

	public createRecordingSession(formId: string, userId?: string): RecordingSession | undefined {
		console.log('(createRecordingSession)', formId, userId);
		const ownerId = userId ?? this._usersRepository.connectedUser$$.value?.id;
		if (!ownerId) {
			return;
		}
		const recordingSession: RecordingSession = {
			id: uuidv4(),
			formId,
			ownerId,
		};
		this._recordingSessionsService.upsert(recordingSession);
		return recordingSession;
	}

	public getRecordingSessionDuration(recordingSessionId: string, includeCreatorToo: boolean = false): number {
		if (!recordingSessionId) {
			// if empty string
			return -1;
		}
		const recordingSession: RecordingSession | undefined = this.get(recordingSessionId);
		if (!recordingSession) {
			// if recording session not available in local store
			return -1;
		}
		const answersDurationList: number[] = [];
		const answers = this._answersManagementService.getAnswersForSession(recordingSessionId);
		answers.forEach((answer) => {
			const answerAttrs: Attr = answer.attrs ? JSON.parse(answer.attrs) : {};
			if (answerAttrs.playlistid && typeof answerAttrs.playlistid === 'string') {
				const tracks = this._tracksRepository.getTracks(answerAttrs.playlistid).filter((t) => t.active);
				tracks.forEach((track) => {
					// console.log(track);

					const fileId: string | undefined = track.fileId;
					const entityFile: EntityFile | undefined = fileId ? this._filesRepository.get(fileId) : undefined;
					if (entityFile) {
						answersDurationList.push(entityFile.duration ?? 0);
					}
				});
			}
		});
		// console.log('answersDurationList', answersDurationList);

		const stepsDurationList: number[] = [];

		if (includeCreatorToo) {
			const steps = this._stepsManagementService.getFormSteps(recordingSession.formId);
			steps.forEach((step) => {
				const stepAttrs: Attr = step.attrs ? JSON.parse(step.attrs) : {};
				if (stepAttrs.playlistid && typeof stepAttrs.playlistid === 'string') {
					const tracks = this._tracksRepository.getTracks(stepAttrs.playlistid).filter((t) => t.active);
					tracks.forEach((track) => {
						const fileId: string | undefined = track.fileId;
						const entityFile: EntityFile | undefined = fileId ? this._filesRepository.get(fileId) : undefined;
						if (entityFile) {
							stepsDurationList.push(entityFile.duration ?? 0);
						}
					});
				}
			});
			// console.log('stepsDurationList', stepsDurationList);
		}

		return sum(answersDurationList) + sum(stepsDurationList);
	}

	public isRecordingSessionSynced$(recordingSessionId: string) {
		let synced: boolean | undefined = undefined;

		const recordingSession$ = this.get$(recordingSessionId).pipe(shareReplay());
		const answers$ = this._answersManagementService.getAnswersForSession$(recordingSessionId).pipe(
			debounceTime(250),
			//  shareReplay()
			startWith([])
		);

		const playlists$ = answers$.pipe(
			switchMap((answers) =>
				combineLatest(
					answers
						.map((answer) => {
							const answerAttrs: Attr = answer.attrs ? JSON.parse(answer.attrs) : {};
							if (answerAttrs.playlistid && typeof answerAttrs.playlistid === 'string') {
								return answerAttrs.playlistid;
							}
							return null;
						})
						.filter((playlistid): playlistid is string => !!playlistid)
						.map((playlistid) => this._playlistsManagementService.get$(playlistid))
				)
			),
			startWith([]),
			shareReplay()
		);

		const tracks$ = playlists$.pipe(
			switchMap((playlists) =>
				combineLatest(
					playlists.map((playlist) => {
						if (playlist) {
							return this._tracksRepository.getTracks$(playlist.id);
						}
						return of([]);
					})
				)
			),
			map((tracksLists) => flatten(tracksLists)),
			debounceTime(100),
			startWith([]),
			shareReplay()
		);

		const trackFiles$ = tracks$.pipe(
			switchMap((tracks) =>
				combineLatest(tracks.map((track) => (track.fileId ? this._filesRepository.get$(track.fileId) : of(undefined))))
			),
			debounceTime(100),
			startWith([]),
			shareReplay()
		);

		const otherFiles$ = answers$.pipe(
			switchMap((answers) =>
				combineLatest(
					answers.map((answer) => {
						const answerAttrs: Attr = answer.attrs ? JSON.parse(answer.attrs) : {};

						if (answerAttrs.imageid && typeof answerAttrs.imageid === 'string') {
							return this._filesRepository.get$(answerAttrs.imageid);
						}
						if (answerAttrs.videoid && typeof answerAttrs.videoid === 'string') {
							return this._filesRepository.get$(answerAttrs.videoid);
						}
						return of(undefined);
					})
				)
			),
			map((files) => files.filter((playlistid): playlistid is EntityFile => !!playlistid)),
			debounceTime(100),
			startWith([]),
			shareReplay()
		);

		return combineLatest([recordingSession$, answers$, playlists$, tracks$, trackFiles$, otherFiles$]).pipe(
			map(([recordingSession, answers, playlists, tracks, trackFiles, otherFiles]) => {
				if (!(recordingSession && recordingSession.toSync === false)) {
					// recording session itself is not synced
					// console.log('recording session itself is not synced', recordingSession);
					return false;
				}
				if (answers.some((answer) => !(answer.toSync === false))) {
					// one answer at least is not synced
					// console.log(
					// 	'one answer at least is not synced',
					// 	answers.filter((answer) => !(answer.toSync === false))
					// );
					return false;
				}
				if (playlists.some((playlist) => !(playlist && playlist.toSync === false))) {
					// one playlist at least is not synced
					// console.log(
					// 	'one playlist at least is not synced or undefined',
					// 	playlists.filter((playlist) => !(playlist?.toSync === false))
					// );
					return false;
				}
				if (tracks.some((track) => !(track && track.toSync === false))) {
					// one track at least is not synced
					// console.log(
					// 	'one track at least is not synced',
					// 	tracks.filter((track) => !(track?.toSync === false))
					// );
					return false;
				}
				if (trackFiles.some((file) => !(file && file.toSync === false && file.fileOnServer === true))) {
					// one file at least is not synced or not on server
					// console.log(
					// 	'one file at least is not synced or not on server',
					// 	trackFiles.filter((file) => !(file && file.toSync === false && file.fileOnServer === true))
					// );
					return false;
				}
				if (otherFiles.some((file) => !(file && file.toSync === false && file.fileOnServer === true))) {
					// one file at least is not synced or not on server
					// console.log(
					// 	'one file at least is not synced  or not on server',
					// 	otherFiles.filter((file) => !(file && file.toSync === false && file.fileOnServer === true))
					// );
					return false;
				}
				return true;
			}),
			filter((isRecordingSessionSynced) => isRecordingSessionSynced !== synced),
			tap((isRecordingSessionSynced) => {
				synced = isRecordingSessionSynced;
			})
		);
	}

	/**
	 *
	 * @param recordingSessionId the id of the recording session
	 * @returns a recording session object, with its user and form
	 */
	public getRecordingSessionListItem$(recordingSessionId: string): Observable<RecordingSessionListItem | null> {
		let cachedRecordingSessionItem: RecordingSessionListItem | null = null;
		return this.get$(recordingSessionId).pipe(
			switchMap((recordingSession: RecordingSession | undefined) => {
				if (!recordingSession) return of([null, null, null]);
				const form$: Observable<Form | undefined> = this._formsQuery.selectEntity(recordingSession?.formId);
				const user$: Observable<User | undefined> = this._usersRepository.get$(recordingSession?.ownerId);
				return combineLatest([of(recordingSession), form$, user$]);
			}),
			map(([recordingSession, form, user]) => {
				if (!recordingSession) return null;
				if (!form) return null;
				if (!user) return null;
				const recordingSessionListItem: RecordingSessionListItem = {
					id: recordingSession?.id,
					recordingSession,
					form,
					user,
				};
				return recordingSessionListItem;
			}),
			filter((recordingSessionListItem) => !isEqual(recordingSessionListItem, cachedRecordingSessionItem)),
			tap((recordingSessionListItem) => {
				cachedRecordingSessionItem = recordingSessionListItem;
			})
		);
	}

	listenTo(recordingSessionId: string, virtualPlaylistId?: string) {
		console.log('listenTo', recordingSessionId);

		this._globalPlayerService.replacePlaylistSource(
			this.convertRecordingSessionsToVirtualPlaylistData$([recordingSessionId], virtualPlaylistId)
		);
		this._globalPlayerService.updateSettings({
			playlist: {
				collapsed: false,
			},
			playbar: {
				collapsed: false,
			},
		});
	}

	public convertRecordingSessionsToVirtualPlaylistData$(
		recordingSessionIds: string[],
		virtualPlaylistId?: string
		// destroyer$: Observable<unknown> = NEVER
	): Observable<{
		virtualPlaylist: VirtualPlaylist | null;
		playlistSettings: NestedPartial<GlobalPlayerServiceSettings> | null;
	}> {
		console.log('convertRecordingSessionsToVirtualPlaylistData$');

		const virtualPlaylistIdToUse = virtualPlaylistId ?? uuidv4();

		const recordingSessions$: Observable<RecordingSession[]> = this._recordingSessionsQuery
			.selectMany(recordingSessionIds)
			.pipe(startWith([]), shareReplay());

		const forms$: Observable<Form[]> = recordingSessions$.pipe(
			switchMap((recordingSessions) => {
				if (recordingSessions.length == 0) return of([]);
				return this._formsQuery.selectMany(recordingSessions.map((r) => r.formId));
			}),
			startWith([]),
			shareReplay()
		);

		const steps$: Observable<Step[]> = forms$.pipe(
			switchMap((forms) => {
				if (forms.length == 0) return of([]);
				return this._stepsQuery.selectAll({
					sortBy: 'rank',
					filterBy: (entity) =>
						forms.map((f) => f.id).includes(entity.formId) &&
						['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
				});
			}),
			startWith([]),
			shareReplay()
		);

		const formOwners$: Observable<User[]> = forms$.pipe(
			switchMap((forms) => {
				if (forms.length == 0) return of([]);
				return this._usersRepository.selectManyByIds$(forms.map((f) => f.ownerId));
			}),
			startWith([]),
			shareReplay()
		);

		const guests$: Observable<User[]> = recordingSessions$.pipe(
			switchMap((recordingSessions) => {
				if (recordingSessions.length == 0) return of([]);
				return this._usersRepository.selectManyByIds$(recordingSessions.map((r) => r.ownerId));
			}),
			startWith([]),
			shareReplay()
		);

		const answers$: Observable<Answer[]> = recordingSessions$.pipe(
			switchMap((recordingSessions) => {
				if (!recordingSessions) return of([]);
				return this._answersQuery.selectAll({
					filterBy: (entity) =>
						recordingSessions.map((r) => r.id).includes(entity.recordingSessionId) &&
						['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
				});
			}),
			startWith([]),
			shareReplay()
		);

		const playlists$: Observable<Playlist[]> = combineLatest([steps$, answers$]).pipe(
			switchMap(([steps, answers]) => {
				const playlistIdsFromSteps = steps
					.map((step) => {
						const stepAttrs: Attr = step.attrs ? JSON.parse(step.attrs) : {};
						return stepAttrs.playlistid as string | undefined;
					})
					.filter((child): child is string => !!child);
				const playlistIdsFromAnswers = answers
					.map((answer) => {
						const answerAttrs: Attr = answer.attrs ? JSON.parse(answer.attrs) : {};
						return answerAttrs.playlistid as string | undefined;
					})
					.filter((child): child is string => !!child);

				const playlistIds: string[] = [...new Set([...playlistIdsFromSteps, ...playlistIdsFromAnswers])];
				return combineLatest(playlistIds.map((playlistId) => this._playlistsQuery.selectEntity(playlistId)));
			}),
			map((playlists) => playlists.filter((child): child is Playlist => !!child)),
			startWith([]),
			shareReplay()
		);

		const tracks$: Observable<Track[]> = playlists$.pipe(
			switchMap((playlists) =>
				combineLatest(playlists.map((playlist) => this._tracksRepository.getTracks$(playlist.id)))
			),
			map((tracksLists) => flatten(tracksLists)),
			startWith([]),
			shareReplay()
		);

		const trackFiles$: Observable<EntityFile[]> = tracks$.pipe(
			switchMap((tracks) =>
				combineLatest(tracks.map((track) => (track.fileId ? this._filesRepository.get$(track.fileId) : of(undefined))))
			),
			map((files) => files.filter((child): child is EntityFile => !!child)),
			startWith([]),
			shareReplay()
		);
		return combineLatest([forms$, steps$, formOwners$, guests$, answers$, trackFiles$]).pipe(
			map(([forms, steps, formOwners, guests, answers, trackFiles]) => {
				if (this._debug) {
					console.log('forms', forms);
					console.log('steps', steps);
					console.log('formOwners', formOwners);
					console.log('guests', guests);
					console.log('answers', answers);
					console.log('trackFiles', trackFiles);
				}

				const virtualPlaylist: VirtualPlaylist = this.convertRecordingSessionToVirtualPlaylist(
					forms,
					steps,
					answers,
					formOwners,
					guests,
					trackFiles,
					virtualPlaylistIdToUse
				);

				const playlistSettings: NestedPartial<GlobalPlayerServiceSettings> = {
					source:
						recordingSessionIds.length === 1
							? {
									objectKind: 'recording-session',
									objectId: recordingSessionIds[0],
							  }
							: undefined,
					title: recordingSessionIds.length === 1 ? guests[0]?.fullName + ' & ' + formOwners[0]?.fullName : undefined,
					description: forms.length === 1 ? forms[0]?.title : undefined,
					playbar: {
						// collapsed: false,
						pictureSRCs: [
							...guests.map((guest) => this._usersRepository.getUserAvatar(guest)),
							...formOwners.map((formOwner) => this._usersRepository.getUserAvatar(formOwner)),
						],
					},
					playlist: {
						// collapsed: false,
						playlistItemsSettings: {
							displayTranscript: true,
						},
					},
					autoPlay: true,
					closed: false,
				};
				return { virtualPlaylist, playlistSettings };
			})
		);
	}

	public convertRecordingSessionToVirtualPlaylist(
		forms: Form[],
		steps: Step[],
		answers: Answer[],
		hosts: User[],
		guests: User[],
		trackFiles: EntityFile[],
		virtualPlaylistId?: string
	) {
		const virtualTracks: VirtualTrack[] = [];

		const virtualPlaylistIdToUse = virtualPlaylistId ?? uuidv4();
		let virtualTrackRank = 0;

		steps.forEach((step) => {
			const form = forms.find((form) => form.id === step.formId);
			const host = hosts.find((host) => host.id === form?.ownerId);
			const stepAttrs: Attr = step.attrs ? JSON.parse(step.attrs) : {};
			const playlistid = stepAttrs.playlistid as string | undefined;

			let description: string | undefined = undefined;
			if (stepAttrs.steptitle && typeof stepAttrs.steptitle === 'string') {
				description = stepAttrs.steptitle;
			}
			if (stepAttrs.stepdescription && typeof stepAttrs.stepdescription === 'string') {
				if (description) {
					description += ' ';
					description += stepAttrs.stepdescription;
				} else {
					description = stepAttrs.stepdescription;
				}
			}

			if (playlistid) {
				const tracks = this._tracksRepository.getTracks(playlistid);
				const vt: VirtualTrack = {
					id: virtualPlaylistIdToUse + '-' + virtualTrackRank,
					active: true,
					files: tracks
						.filter((t) => t.active)
						.map((track: Track) => {
							if (track.fileId) {
								const entityFile = trackFiles.find((f) => f.id === track.fileId);
								if (entityFile) {
									return {
										fileId: entityFile.id,
										fileSrc: convertEntityFileToUrl(entityFile),
										mediaType: entityFile.kind == 'video' ? 'video' : 'audio',
									};
								}
							}
							return undefined;
						})
						.filter((child): child is FileForVirtualTrack => !!child),
					transcript: {
						canEditTranscript: false,
						editedTranscript:
							tracks
								.filter((t) => t.active)
								.map((track: Track) => {
									if (track.fileId) {
										const entityFile = trackFiles.find((f) => f.id === track.fileId);
										if (entityFile) {
											return getTranscriptFromData(entityFile, 'edited_manual');
										}
									}
									return undefined;
								})
								.filter((child): child is string => !!child)
								.join('\n') || undefined,
						originalTranscript:
							tracks
								.filter((t) => t.active)
								.map((track: Track) => {
									if (track.fileId) {
										const entityFile = trackFiles.find((f) => f.id === track.fileId);
										if (entityFile) {
											return getTranscriptFromData(entityFile);
										}
									}
									return undefined;
								})
								.filter((child): child is string => !!child)
								.join('\n') || undefined,
					},
					source: { id: playlistid, kind: 'playlist' },
					details: {
						title: host ? host.fullName + ' (' + host.email + ')' : undefined,
						description,
						pictureSrcs: [this._usersRepository.getUserAvatar(host)],
						label: 'host',
					},
				};
				if (vt.files.length > 0) {
					virtualTracks.push(vt);
					virtualTrackRank++;
				}
			}

			const stepAnswers = answers.filter((a) => a.stepId === step.id);
			for (const answer of stepAnswers) {
				const guest = guests.find((g) => g.id === answer.ownerId);
				const answerAttrs: Attr = answer.attrs ? JSON.parse(answer.attrs) : {};
				const playlistid = answerAttrs.playlistid as string | undefined;
				const videoid = answerAttrs.videoid as string | undefined;

				if (playlistid) {
					const tracks = this._tracksRepository.getTracks(playlistid);
					const vt: VirtualTrack = {
						id: virtualPlaylistIdToUse + '-' + virtualTrackRank,
						active: true,
						files: tracks
							.filter((t) => t.active)
							.map((track: Track) => {
								if (track.fileId) {
									const entityFile = trackFiles.find((f) => f.id === track.fileId);
									if (entityFile) {
										return {
											fileId: entityFile.id,
											fileSrc: convertEntityFileToUrl(entityFile),
										};
									}
								}
								return undefined;
							})
							.filter((child): child is FileForVirtualTrack => !!child),
						transcript: {
							canEditTranscript: false,
							editedTranscript:
								tracks
									.filter((t) => t.active)
									.map((track: Track) => {
										if (track.fileId) {
											const entityFile = trackFiles.find((f) => f.id === track.fileId);
											if (entityFile) {
												return getTranscriptFromData(entityFile, 'edited_manual');
											}
										}
										return undefined;
									})
									.filter((child): child is string => !!child)
									.join('\n') || undefined,
							originalTranscript:
								tracks
									.filter((t) => t.active)
									.map((track: Track) => {
										if (track.fileId) {
											const entityFile = trackFiles.find((f) => f.id === track.fileId);
											if (entityFile) {
												return getTranscriptFromData(entityFile);
											}
										}
										return undefined;
									})
									.filter((child): child is string => !!child)
									.join('\n') || undefined,
						},

						source: { id: playlistid, kind: 'playlist' },
						details: {
							title: guest ? guest.fullName + ' (' + guest.email + ')' : undefined,
							description,
							pictureSrcs: [this._usersRepository.getUserAvatar(guest)],
							label: 'guest',
						},
					};
					if (vt.files.length > 0) {
						virtualTracks.push(vt);
						virtualTrackRank++;
					}
				} else if (videoid) {
					const videoEntityFile = this._filesRepository.get(videoid);
					if (videoEntityFile) {
						const vt: VirtualTrack = {
							id: virtualPlaylistIdToUse + '-' + virtualTrackRank,
							active: true,
							files: [
								{
									fileId: videoid,
									fileSrc: convertEntityFileToUrl(videoEntityFile),
									mediaType: videoEntityFile.kind == 'video' ? 'video' : 'audio',
								},
							],
							transcript: {
								canEditTranscript: false,
								originalTranscript: getTranscriptFromData(videoEntityFile),
								editedTranscript: getTranscriptFromData(videoEntityFile, 'edited_manual'),
							},
							source: { id: videoid, kind: 'file' },
							details: {
								title: host ? host.fullName + ' (' + host.email + ')' : undefined,
								description,
								pictureSrcs: [this._usersRepository.getUserAvatar(host)],
								label: 'guest',
							},
						};
						if (vt.files.length > 0) {
							virtualTracks.push(vt);
							virtualTrackRank++;
						}
					}
				}
			}
		});

		let playlistName: string | undefined = undefined;
		if (forms.length === 1) {
			playlistName = forms[0].title;
			if (guests.length === 1) {
				playlistName += ' ' + guests[0].fullName + ' (' + guests[0].email + ')';
			}
		}

		const virtualPlaylist: VirtualPlaylist = {
			id: virtualPlaylistIdToUse,
			virtualTracks,
			details: {
				title: playlistName,
			},
		};
		return virtualPlaylist;
	}

	public exportRecordingSessionsToCSV(recordingSessionIds: string[], saveName: string = 'exports.csv') {
		return this._restService
			.postForBlob('/exports/export-recording-sessions-to-csv', recordingSessionIds)
			.pipe(
				tap((csv) => {
					this._filesRepository.saveAs(csv, saveName);
				})
			)
			.subscribe();
	}

	public exportRecordingSessionsToDOCX(recordingSessionIds: string[], saveName: string = 'exports.docx') {
		return this._restService
			.postForBlob('/exports/export-recording-sessions-to-docx', recordingSessionIds)
			.pipe(
				tap((csv) => {
					this._filesRepository.saveAs(csv, saveName);
				})
			)
			.subscribe();
	}
}
