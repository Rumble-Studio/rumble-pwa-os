import { Injectable } from '@angular/core';
import { Playlist } from './playlist.model';
import { PlaylistsStore } from './playlists.store';

@Injectable({ providedIn: 'root' })
export class PlaylistsService {
	constructor(private playlistsStore: PlaylistsStore) {}

	add(playlist: Playlist) {
		this.playlistsStore.add(playlist);
	}

	update(id: string, playlist: Partial<Playlist>) {
		this.playlistsStore.update(id, playlist);
	}

	remove(id: string) {
		this.playlistsStore.remove(id);
	}

	removeAll() {
		this.playlistsStore.remove();
	}

	upsertMany(playlists: Playlist[]) {
		this.playlistsStore.upsertMany(playlists);
	}

	set(playlists: Playlist[]) {
		this.playlistsStore.set(playlists);
	}
	upsert(playlist: Playlist) {
		this.playlistsStore.upsert(playlist.id, playlist);
	}
}
