import { Injectable } from '@angular/core';
import { createStore, propsFactory, select } from '@ngneat/elf';

import {
	addEntities,
	deleteEntities,
	selectActiveEntities,
	selectActiveEntity,
	selectAllEntities,
	selectEntity,
	setActiveId,
	setEntities,
	toggleActiveIds,
	updateEntities,
	withActiveId,
	withActiveIds,
	withEntities,
	withUIEntities,
} from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { Syncable } from '@rumble-pwa/mega-store';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

// to import:
// - in constructor:		private _playlistsRepository: PlaylistsRepository
// - in imports: 			import { PlaylistsRepository } from '@rumble-pwa/playlists/state';

const storeName = 'playlists';

export interface PlaylistUI {
	id: number;
	displayTracks: boolean;
}

export interface Playlist extends Syncable {
	id: string;
	title?: string;
	description?: string;
	ownerId: string;
}

@Injectable({ providedIn: 'root' })
export class PlaylistsRepository {
	public activePlaylists$: Observable<Playlist[]>;
	public activePlaylist$: Observable<Playlist | undefined>; // should be the playlist being recorded
	public playlists$: Observable<Playlist[]>;
	private _persist;

	private _store;

	constructor() {
		this._store = this.createStore();
		this._persist = persistState(this._store, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this._persist.initialized$.subscribe(() => console.log(storeName + ' initialized', this._store.value));

		this.playlists$ = this._store.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.activePlaylist$ = this._store.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activePlaylists$ = this._store.pipe(selectActiveEntities(), shareReplay({ refCount: true }));

		// // [test persistence on refresh] create random playlist
		// const now = new Date();
		// this.addPlaylist({
		// 	id: now.getTime().toString(),
		// 	ownerId: '1',
		// });

		// this._store.subscribe((state) => console.log('playlists state:', state));
	}

	selectPlaylist$(playlistId: Playlist['id']): Observable<Playlist | undefined> {
		return this._store.pipe(selectEntity(playlistId), shareReplay({ refCount: true }));
	}

	setPlaylists(playlists: Playlist[]) {
		this._store.update(setEntities(playlists));
	}

	addPlaylist(playlist: Playlist) {
		this._store.update(addEntities(playlist));
	}

	updatePlaylist(id: Playlist['id'], playlist: Partial<Playlist>) {
		this._store.update(updateEntities(id, playlist));
	}

	deletePlaylist(id: Playlist['id']) {
		this._store.update(deleteEntities(id));
	}

	setActiveId(id: Playlist['id']) {
		this._store.update(setActiveId(id));
	}

	toggleActiveIds(ids: Array<Playlist['id']>) {
		this._store.update(toggleActiveIds(ids));
	}

	private createStore(): typeof store {
		const store = createStore(
			//
			{ name: storeName },
			withEntities<Playlist>(),
			withUIEntities<PlaylistUI>(),
			withActiveId(),
			withActiveIds()
		);

		return store;
	}
}
