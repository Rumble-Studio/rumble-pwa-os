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
import { AuthService } from '@rumble-pwa/auth-system';
import { convertEntityFileToUrl, EntityFile, getTranscriptFromData } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Playlist } from '@rumble-pwa/mega-store';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { VirtualPlaylist, VirtualTrack } from '@rumble-pwa/player/services';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { ElfSyncable, prepEntityForCreation, prepEntityForRefresh, prepEntityForUpdate } from '@rumble-pwa/utils';
import { flatten, sortBy } from 'lodash';
import { combineLatest, Observable, of, BehaviorSubject } from 'rxjs';
import { debounceTime, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const storeName = 'tracks';
const storePropsName = 'trackProps';

export interface Filetag {
	id: string;
	title?: string;
	description?: string;
	kind?: string;
	value?: string;
	extra?: string;
	details?: string;
}

export interface Track extends ElfSyncable {
	id: string;
	playlistId: string;
	fileId?: string;
	active: boolean;
	rank: number;
	fileSrc?: string; // only locally
	transcript?: string; // only locally
	beingRecorded?: boolean; // only locally
	corrupted?: boolean; // only locally
}

export interface TrackDetails {
	track?: Track;
	fromStep?: boolean;
	preventRedirection?: boolean;
	redirectionTarget?: string;
}

export interface TrackUI {
	id: Track['id'];
}
export interface TrackProps {
	something?: string;
}

export const DEFAULT_TRACK_PROPS: TrackProps = {
	something: '',
};

export const TRACK_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_TRACK_PROPS,
});

// CUSTOM INTERFACE AND CONST
// (empty)

@Injectable({ providedIn: 'root' })
export class TracksRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public tracks$: Observable<Track[]>;
	private _tracksToSync$: Observable<Track[]>;
	public trackUIs$: Observable<TrackUI[]>;
	public activetracks$: Observable<Track[]>;
	public activeTrack$: Observable<Track | undefined>;
	public trackProps$: Observable<TrackProps>;

	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	// (empty)

	/**
	 *
	 * @param _restService
	 * @param _objectPromptService
	 * @param _subscriptionsManagementService  - Used for prompt opening
	 */
	constructor(
		//
		private _restService: RestService,
		private _authService: AuthService,
		private _filesRepository: FilesRepository,
		private _playlistsManagementService: PlaylistsManagementService, // to duplicate playlist and build virtual playlist
		private _usersRepository: UsersRepository // to get logged-in user when duplicating a playlist and to build virtual playlsit (virtual track details)
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.tracks$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.trackUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeTrack$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activetracks$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.trackProps$ = this._store$$.pipe(TRACK_PROPS_PIPES.selectTrackProps());

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

		this._tracksToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			}),
			switchMap((tracks) => {
				// we need to filter out tracks with non-server-existing playlist
				// we need to filter out tracks with non server existing file

				tracks.map((track) => {
					return combineLatest([
						this._playlistsManagementService.get$(track.playlistId),
						track.fileId ? this._filesRepository.get$(track.fileId) : of<EntityFile | undefined>(undefined),
					]).pipe(
						map(([playlist, entityFile]) => {
							return playlist?.toSync === false && (!entityFile || entityFile.toSync === false);
						})
					);
				});
				return of(tracks);
			})
		);

		// build object to sync $
		this._tracksToSync$.pipe(debounceTime(500)).subscribe((tracksToSync) => {
			tracksToSync.forEach((track) => {
				if (track?.operation === 'creation') {
					this._postToServer(track);
				} else if (track?.operation === 'update') this._putToServer(track);
			});
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//
		// (empty)
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(track: Track) {
		return this._restService
			.post<Track>('/tracks', track)
			.pipe(
				tap((r) => {
					this.refreshTrack(r);
				})
			)
			.subscribe();
	}

	private _putToServer(track: Track) {
		return this._restService
			.put<Track>(`/tracks/${track.id}`, track)
			.pipe(
				tap((r) => {
					this.refreshTrack(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<Track[]>('/tracks')
			.pipe(
				tap((tracks) => {
					if (replace) {
						this._store$$.update(upsertEntities(tracks));
					} else {
						tracks.forEach((track) => {
							this.refreshTrack(track);
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
	 * @param tracks
	 */
	public setTracks(tracks: Track[]) {
		this._store$$.update(setEntities(tracks));
	}

	/**
	 * Add a new track to the collection
	 * @param track
	 */
	public addTrack(track: Track) {
		const syncableTrack = prepEntityForCreation<Track>(track);
		this._store$$.update(addEntities(syncableTrack));
	}

	/**
	 * Update an existing track in the collection
	 * @param id
	 * @param trackUpdate (partial)
	 */
	public updateTrack(id: Track['id'] | undefined, trackUpdate: Partial<Track>) {
		const idToUse = id ?? trackUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update track without an id');
		}
		const previousTrack = this._store$$.query(getEntity(idToUse));
		if (!previousTrack) {
			throw new Error(`Track with id ${idToUse} not found`);
		}
		const updatedTrack: Track = {
			...previousTrack,
			...trackUpdate,
		};
		const syncableTrack = prepEntityForUpdate<Track>(updatedTrack, previousTrack);
		this._store$$.update(updateEntities(idToUse, syncableTrack));
	}

	/**
	 * Upsert an entity (creates it if missing) respecting elfSyncable concept
	 * @param track
	 */
	public upsertTrack(track: Track) {
		const previousTrack = this._store$$.query(getEntity(track.id));
		if (previousTrack) {
			this.updateTrack(track.id, track);
		} else {
			this.addTrack(track);
		}
	}

	/**
	 * Refresh is public to be called by filetag repo
	 * @param track
	 */
	public refreshTrack(track: Track) {
		const previousTrack = this._store$$.query(getEntity(track.id));
		const syncableTrack = prepEntityForRefresh<Track>(track, previousTrack);
		this._store$$.update(upsertEntities([syncableTrack]));
	}

	/**
	 * Subscribe to a track
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<Track | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string): Track | undefined {
		return this._store$$.query(getEntity(id));
	}

	public getAll(): Track[] {
		return this._store$$.query(getAllEntities());
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	public setActiveId(id: Track['id']) {
		this._store$$.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<Track['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setTrackProps(trackProps: Partial<TrackProps>) {
		this._store$$.update(TRACK_PROPS_PIPES.updateTrackProps(trackProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Track>(),
			withUIEntities<TrackUI>(),
			TRACK_PROPS_PIPES.withTrackProps(),
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

	public getTracks$(playlistId: Playlist['id']) {
		return this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (track) =>
					track.playlistId === playlistId && ['deleted', 'archived'].indexOf(track.state ?? 'default') == -1,
			}),
			map((tracks) => sortBy(tracks, 'rank'))
		);
	}

	/**
	 * Get all tracks for a specific playlist, sorted by rank (filter out deleted and archived tracks)
	 * @param playlistId
	 * @returns
	 */
	public getTracks(playlistId: Playlist['id']) {
		return sortBy(
			this._store$$.query(
				getAllEntitiesApply({
					filterEntity: (track) =>
						track.playlistId === playlistId && ['deleted', 'archived'].indexOf(track.state ?? 'default') == -1,
				})
			),
			'rank'
		);
	}

	// dupliquer une playlist c'est aussi dupliquer les tracks mais pas les files
	duplicatePlaylist(playlistId: Playlist['id']): string | undefined {
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;

		const originalPlaylist: Playlist | undefined = this._playlistsManagementService.get(playlistId);
		if (!originalPlaylist) return;
		const newPlaylistId = uuidv4();
		const newPlaylist: Playlist = {
			...originalPlaylist,
			id: newPlaylistId,
			ownerId,
		};

		this._playlistsManagementService.add(newPlaylist);

		const originalTracks = this.getTracks(playlistId);
		if (originalTracks.length === 0) return newPlaylistId;
		const newTracks = originalTracks.map((track) => {
			const newTrackId = uuidv4();
			const newTrack: Track = {
				...track,
				id: newTrackId,
				playlistId: newPlaylistId,
			};
			return newTrack;
		});
		this._store$$.update(addEntities(newTracks));
		return newPlaylistId;
	}

	public convertPlaylistIdToVirtualPlaylist$(
		playlistId: string,
		virtualPlaylistId: string,
		removeInactiveTracks = false
	): Observable<VirtualPlaylist> {
		this._playlistsManagementService.createPlaylistIfMissing(playlistId);

		// build virtual playlist from playlist id and upsert it to virtual player service
		return this.getTracks$(playlistId).pipe(
			switchMap((tracks) => {
				if (!tracks) return of([]);

				if (tracks.length === 0) {
					return of([]);
				}

				return combineLatest(
					tracks
						.filter((t) => t.active || !removeInactiveTracks)
						.map((track) =>
							track.fileId
								? this._filesRepository.get$(track.fileId).pipe(
										map((file) => {
											return { track, file };
										})
								  )
								: of({ track, file: undefined })
						)
				);
			}),
			switchMap((tracksAndFiles) => {
				if (tracksAndFiles.length === 0) return of([]);
				return combineLatest(
					tracksAndFiles.map((trackAndFile) => {
						return this._usersRepository.get$(trackAndFile.file?.ownerId ?? '').pipe(
							map((user) => {
								return { ...trackAndFile, user };
							})
						);
					})
				);
			}),
			map((tracksFilesUsers) => {
				const virtualTracks: VirtualTrack[] = tracksFilesUsers
					.map((trackAndFile, trackAndFileIndex) => {
						const { track, file, user } = trackAndFile;
						if (!file) {
							return undefined;
						}

						const virtualTrack: VirtualTrack = {
							id: virtualPlaylistId + '-' + trackAndFileIndex,
							active: track.active,
							files: [
								{
									fileId: file.id,
									fileSrc: convertEntityFileToUrl(file),
									fileSynced: file?.fileOnServer,
									mediaType: file.kind == 'video' ? 'video' : 'audio',
								},
							],
							transcript: {
								canEditTranscript: true,
								originalTranscript: getTranscriptFromData(file),
								editedTranscript: getTranscriptFromData(file, 'edited_manual'),
							},
							source: {
								id: track.id,
								kind: 'track',
							},
							details: {
								title: user?.fullName ?? 'host',
								pictureSrcs: user ? [this._usersRepository.getUserAvatar(user)] : [],
							},
						};
						return virtualTrack;
					})
					.filter((vt): vt is VirtualTrack => !!vt);

				const pictureSrcs = flatten(virtualTracks.map((vt) => vt.details?.pictureSrcs ?? []));

				const virtualPlaylist: VirtualPlaylist = {
					id: virtualPlaylistId,
					virtualTracks,
					source: {
						id: playlistId,
						kind: 'playlist',
					},
					details: {
						pictureSrcs: [...new Set(pictureSrcs)],
					},
				};
				return virtualPlaylist;
			})
		);
	}
}
