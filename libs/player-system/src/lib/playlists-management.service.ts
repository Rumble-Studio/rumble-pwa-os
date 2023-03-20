import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Playlist, PlaylistItem, PlaylistsQuery, PlaylistsService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
	providedIn: 'root',
})
export class PlaylistsManagementService {
	playlists$$: BehaviorSubject<Playlist[]>;

	constructor(
		private restService: RestService,
		private playlistsService: PlaylistsService,
		private playlistsQuery: PlaylistsQuery,
		private usersRepository: UsersRepository,
		private _usersRepository: UsersRepository
	) {
		// console.log('%c[PlaylistsMgmtSrv](constructor)', 'color: #00a7e1; font-weight: bold');

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});

		this.playlists$$ = this.playlistsQuery.playlists$$;
	}

	pullData() {
		this._usersRepository.isConnected$$
			.pipe(
				switchMap((isLoggedIn) => {
					if (isLoggedIn) {
						return this.restService.get<Playlist[]>('/playlists');
					}
					return of([] as Playlist[]);
				}),
				tap((playlistApis) => {
					this.playlistsService.upsertMany(
						playlistApis.map((playlistApis) => {
							return { ...playlistApis, operation: 'refresh' };
						})
					);
				})
			)
			.subscribe();
	}

	pushData() {
		this._usersRepository.isConnected$$
			.pipe(
				switchMap((isLoggedIn) => {
					if (isLoggedIn) {
						return this.playlistsQuery.playlistsToSync$;
					}
					return of([] as Playlist[]);
				}),
				tap((playlists) => {
					playlists.forEach((playlist) => {
						if (playlist?.operation === 'creation') {
							this._postToServer(playlist);
						} else if (playlist?.operation === 'update') this._putToServer(playlist);
					});
				})
			)
			.subscribe();
	}

	public add(playlist: Partial<Playlist>) {
		const playlistId = uuidv4();

		const ownerId = this.usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) {
			throw new Error('No ownerId found');
		}

		const newPlaylist: Playlist = {
			id: playlistId,
			ownerId,
			...playlist,
		};

		if (!newPlaylist.ownerId) {
			console.error('(add) YOU ARE NOT OWNER!!!', { playlist, newPlaylist });
			return;
		}
		this.playlistsService.add(newPlaylist);
		return newPlaylist;
	}

	public upsert(playlist: Partial<Playlist>) {
		const playlistId = uuidv4();

		const ownerId = this.usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) {
			throw new Error('No ownerId found');
		}

		const newPlaylist: Playlist = {
			id: playlistId,
			ownerId,
			...playlist,
		};

		if (!newPlaylist.ownerId) {
			console.error('(upsert) YOU ARE NOT OWNER!!!', { playlist, newPlaylist });
			return;
		}
		this.playlistsService.upsert(newPlaylist);
		return newPlaylist;
	}

	public update(playlist_id: string, updatedPlaylist: Partial<Playlist>) {
		this.playlistsService.update(playlist_id, updatedPlaylist);
	}
	public removeFromStore(id: string) {
		this.playlistsService.remove(id);
	}
	public delete(id: string) {
		this.playlistsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.playlistsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.playlistsService.update(id, { state: 'default' });
	}
	public get(id: string) {
		return this.playlistsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.playlistsQuery.selectEntity(id);
	}

	public getAsPlaylistItem$(playlistId: string, partialPlaylistItem?: Partial<PlaylistItem>) {
		return this.get$(playlistId).pipe(
			map((playlist) => {
				if (!playlist) return null;
				// todo insert switchMap to have owner details in a reactive manner
				const playlistItem: PlaylistItem = {
					id: uuidv4(),
					contentKind: 'file',
					contentId: playlistId,
					title: playlist.title,
					details: {
						user: this._usersRepository.get(playlist.ownerId),
						userId: this._usersRepository.get(playlist.ownerId)?.id,
					},
					...partialPlaylistItem,
				};
				return playlistItem;
			})
		);
	}

	public has(id: string) {
		return this.playlistsQuery.hasEntity(id);
	}

	//
	// SERVER SYNC
	//
	private _putToServer(playlist: Playlist) {
		if (playlist.id === '') {
			this.removeFromStore(playlist.id);
		}
		return this.restService
			.put<Playlist>('/playlists/' + playlist.id, playlist)
			.pipe(
				tap((r) => {
					this.playlistsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(playlist: Playlist) {
		if (playlist.id === '') {
			this.removeFromStore(playlist.id);
		}
		return this.restService
			.post<Playlist>('/playlists', playlist)
			.pipe(
				tap((r) => {
					this.playlistsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	// CUSTOM FN PLAYLIST

	createPlaylistIfMissing(playlistId: string) {
		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				if (!this.has(playlistId)) {
					this.upsert({
						id: playlistId,
					});
				}
			});
	}
}
