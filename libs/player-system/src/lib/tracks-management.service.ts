// import { Injectable } from '@angular/core';
// import { RestService } from '@rumble-pwa/requests';
// import { debounceTime, switchMap, take, tap } from 'rxjs/operators';
// import { v4 as uuidv4 } from 'uuid';

// import { AuthService } from '@rumble-pwa/auth-system';

// import { Track, TracksService, TracksQuery } from '@rumble-pwa/mega-store';
// import { selectPersistStateInit } from '@datorama/akita';
// import { BehaviorSubject, Observable, of } from 'rxjs';
// import { getRouteQueryParam$ } from '@rumble-pwa/utils';
// import { ActivatedRoute } from '@angular/router';
// import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

// @UntilDestroy()
// @Injectable({
// 	providedIn: 'root',
// })
// export class TracksManagementService {
// 	tracks$$: BehaviorSubject<Track[]>;

// 	debug = false;

// 	constructor(
// 		private restService: RestService,
// 		private tracksService: TracksService,
// 		private tracksQuery: TracksQuery,
// 		private authService: AuthService,
// 		private activatedRoute: ActivatedRoute
// 	) {
// 		selectPersistStateInit()
// 			.pipe(take(1))
// 			.subscribe(() => {
// 				this.pushData();
// 				this.pullData();
// 			});

// 		this.tracks$$ = this.tracksQuery.tracks$$;

// 		getRouteQueryParam$(this.activatedRoute, 'debug')
// 			.pipe(
// 				untilDestroyed(this),
// 				tap((debug) => {
// 					this.debug = !!debug;
// 				})
// 			)
// 			.subscribe();
// 	}

// 	pullData() {
// 		// get tracks data from server (if isloggedIn)
// 		this._usersRepository.isConnected$$
// 			.pipe(
// 				switchMap((isLoggedIn) => {
// 					if (isLoggedIn) {
// 						return this.restService.get<Track[]>('/tracks');
// 					}
// 					return of([] as Track[]);
// 				}),
// 				tap((trackApis) => {
// 					this.tracksService.upsertMany(
// 						trackApis.map((trackApis) => {
// 							return { ...trackApis, operation: 'refresh' };
// 						})
// 					);
// 				})
// 			)
// 			.subscribe();
// 	}

// 	pushData() {
// 		this._usersRepository.isConnected$$
// 			.pipe(
// 				switchMap((isLoggedIn) => {
// 					if (isLoggedIn) {
// 						return this.tracksQuery.tracksToSync$;
// 					}
// 					return of([] as Track[]);
// 				}),
// 				debounceTime(1000),
// 				tap((tracks) => {
// 					tracks.forEach((track) => {
// 						if (track?.operation === 'creation') {
// 							this._postToServer(track);
// 						} else if (track?.operation === 'update') this._putToServer(track);
// 					});
// 				})
// 			)
// 			.subscribe();
// 	}

// 	public add(track: Partial<Track> & { playlistId: string }) {
// 		const trackId = uuidv4();

// 		const newTrack: Track = {
// 			id: trackId,
// 			active: true,
// 			rank: this.tracksQuery.getCount((e) => e.playlistId === track.playlistId),
// 			...track,
// 		};
// 		if (this.debug) console.log('Adding this track:', { newTrack });
// 		this.tracksService.add(newTrack);
// 		return newTrack;
// 	}
// 	public update(track_id: string, updatedTrack: Partial<Track>) {
// 		this.tracksService.update(track_id, updatedTrack);
// 	}
// 	public upsert(track: Partial<Track> & { playlistId: string }) {
// 		const trackId = uuidv4();

// 		const newTrack: Track = {
// 			id: track.id ?? trackId,
// 			active: true,
// 			rank: this.tracksQuery.getCount((e) => e.playlistId === track.playlistId),
// 			...track,
// 		};
// 		if (this.debug) console.log('Upserting this track:', { newTrack });
// 		this.tracksService.upsert(newTrack);
// 		return newTrack;
// 	}
// 	public removeFromStore(id: string) {
// 		this.tracksService.remove(id);
// 	}
// 	public delete(id: string) {
// 		this.tracksService.update(id, { state: 'deleted' });
// 	}
// 	public archive(id: string) {
// 		this.tracksService.update(id, { state: 'archived' });
// 	}
// 	public restore(id: string) {
// 		this.tracksService.update(id, { state: 'default' });
// 	}
// 	public get(id: string) {
// 		return this.tracksQuery.getEntity(id);
// 	}
// 	public get$(id: string) {
// 		return this.tracksQuery.selectEntity(id);
// 	}

// 	//
// 	// SERVER SYNC
// 	//
// 	private _putToServer(track: Track) {
// 		return this.restService
// 			.put<Track>('/tracks/' + track.id, track)
// 			.pipe(
// 				tap((r) => {
// 					this.tracksService.upsert({ ...r, operation: 'refresh' });
// 				})
// 			)
// 			.subscribe();
// 	}
// 	private _postToServer(track: Track) {
// 		return this.restService
// 			.post<Track>('/tracks', track)
// 			.pipe(
// 				tap((r) => {
// 					this.tracksService.upsert({ ...r, operation: 'refresh' });
// 				})
// 			)
// 			.subscribe();
// 	}
// }
