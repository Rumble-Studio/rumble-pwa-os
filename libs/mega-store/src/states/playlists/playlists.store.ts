import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Playlist } from './playlist.model';

export type PlaylistsState = EntityState<Playlist>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'playlists', resettable: true })
@ToSync<Playlist>()
export class PlaylistsStore extends EntityStore<PlaylistsState> {
	constructor() {
		super();
	}
}
