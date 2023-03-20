import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { PlaylistsStore, PlaylistsState } from './playlists.store';

import { BehaviorSubject, Observable } from 'rxjs';
import { Playlist } from './playlist.model';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { isEqual } from 'lodash';

@Injectable({ providedIn: 'root' })
export class PlaylistsQuery extends QueryEntity<PlaylistsState> {
	playlists: Playlist[] = [];

	playlists$: Observable<Playlist[]> = this.selectAll({
		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
	}).pipe(
		filter((playlists) => !isEqual(this.playlists, playlists)),
		tap((playlists) => {
			this.playlists = playlists;
		}),
		shareReplay()
	);
	playlists$$: BehaviorSubject<Playlist[]> = new BehaviorSubject<Playlist[]>([]);
	playlistsToSync$: Observable<Playlist[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: PlaylistsStore) {
		super(store);
		this.playlists$.subscribe(this.playlists$$);
	}
}
