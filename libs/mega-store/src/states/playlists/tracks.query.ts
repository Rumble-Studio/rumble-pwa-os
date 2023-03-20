// import { Injectable } from '@angular/core';
// import { QueryEntity } from '@datorama/akita';
// import { TracksStore, TracksState } from './tracks.store';

// import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
// import { Track } from './track.model';
// import { debounceTime, filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
// import { isEqual } from 'lodash';
// import { PlaylistsQuery } from './playlists.query';
// import { FilesRepository } from '@rumble-pwa/files/state';

// @Injectable({ providedIn: 'root' })
// export class TracksQuery extends QueryEntity<TracksState> {
// 	tracks: Track[] = [];

// 	tracks$: Observable<Track[]> = this.selectAll({
// 		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
// 	}).pipe(
// 		filter((tracks) => !isEqual(this.tracks, tracks)),
// 		tap((tracks) => {
// 			this.tracks = tracks;
// 		}),
// 		shareReplay()
// 	);
// 	tracks$$: BehaviorSubject<Track[]> = new BehaviorSubject<Track[]>([]);
// 	tracksToSync$: Observable<Track[]> = this.selectAll({
// 		filterBy: (entity) => entity.toSync === true,
// 	}).pipe(
// 		switchMap((tracks) => {
// 			// to ensure to only sync tracks if files are on the server
// 			const tracksWithEntriesInDb$ = tracks.map((track) =>
// 				combineLatest([
// 					this.playlistQuery.selectEntity(track.playlistId),
// 					this.filesQuery.selectEntity(track.fileId),
// 				]).pipe(
// 					map(([playlist, file]) => {
// 						return {
// 							track,
// 							entryInDb: !!file?.entryInDb,
// 							playlistSynced: playlist?.toSync === false,
// 						};
// 					})
// 				)
// 			);

// 			return combineLatest(tracksWithEntriesInDb$);
// 		}),
// 		map(
// 			(tracksWithEntriesInDb) =>
// 				tracksWithEntriesInDb
// 					.filter((tf) => tf.entryInDb)
// 					.filter((tf) => tf.playlistSynced)
// 					.map((tf) => tf.track),
// 			debounceTime(300)
// 		)
// 	);
// 	constructor(
// 		protected store: TracksStore,
// 		private _filesRepository: FilesRepository,
// 		private playlistQuery: PlaylistsQuery
// 	) {
// 		super(store);
// 		this.tracks$.subscribe(this.tracks$$);
// 	}
// }
