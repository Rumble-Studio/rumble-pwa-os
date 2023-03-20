import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Mix, MixesQuery, MixesService, PlaylistItem } from '@rumble-pwa/mega-store';
import { VirtualPlaylist } from '@rumble-pwa/player/services';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { sortBy } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, map, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface NewMixData {
	virtualPlaylist: VirtualPlaylist | undefined;
}

@Injectable({
	providedIn: 'root',
})
export class MixesManagementService {
	mixes$$: BehaviorSubject<Mix[]>;
	mixes$: Observable<Mix[]>;

	constructor(
		private restService: RestService,
		private mixesService: MixesService,
		private mixesQuery: MixesQuery,
		private _usersRepository: UsersRepository
	) {
		console.log('%c[MixesManagementService](constructor)', 'color: #00a7e1; font-weight: bold');

		this.mixes$$ = this.mixesQuery.mixes$$;
		this.mixes$ = this.mixesQuery.mixes$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get mixes data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Mix[]>('/mixes').subscribe((mixApis) => {
					this.mixesService.upsertMany(
						mixApis.map((mixApi) => {
							return { ...mixApi, operation: 'refresh' };
						})
					);
				});
		});
	}

	pushData() {
		this.mixesQuery.mixesToSync$.pipe(debounceTime(1000)).subscribe((mixes) => {
			mixes.forEach((mix) => {
				if (mix?.operation === 'creation') {
					this._postToServer(mix);
				} else if (mix?.operation === 'update') this._putToServer(mix);
			});
		});
	}

	public add(data: Mix) {
		this.mixesService.add(data);
	}
	public update(id: string, data: Partial<Mix>) {
		this.mixesService.update(id, data);
	}
	public removeFromStore(id: string) {
		this.mixesService.remove(id);
	}
	public delete(id: string) {
		this.mixesService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.mixesService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.mixesService.update(id, { state: 'default' });
	}

	public getAll$(includeArchived = false) {
		return this.mixesQuery
			.selectAll({
				filterBy: (entity) =>
					['deleted', ...(includeArchived ? [] : ['archived'])].indexOf(entity.state || 'default') == -1,
			})
			.pipe(map((mixes) => sortBy(mixes, 'timeCreation')));
	}

	public getAll() {
		return this.mixesQuery.mixes$$.getValue();
	}

	public get(id: string) {
		return this.mixesQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.mixesQuery.selectEntity(id);
	}

	//
	// SERVER SYNC
	//
	private _putToServer(mix: Mix) {
		return this.restService
			.put<Mix>('/mixes/' + mix.id, mix)
			.pipe(
				tap((r) => {
					this.mixesService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(mix: Mix) {
		return this.restService
			.post<Mix>('/mixes', mix)
			.pipe(
				tap((r) => {
					this.mixesService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	// PlaylistItem generation
	public getAsPlaylistItem$(mixId: string, partialPlaylistItem?: Partial<PlaylistItem>) {
		return this.get$(mixId).pipe(
			map((mix) => {
				if (!mix) return null;
				const playlistItem: PlaylistItem = {
					id: uuidv4(),
					contentKind: 'playlist',
					contentId: 'mix-' + mix.id, // deterministic id from mix,
					title: mix.name,
					details: {
						user: this._usersRepository.get(mix.ownerId),
						userId: this._usersRepository.get(mix.ownerId)?.id,
					},
					...partialPlaylistItem,
				};
				return playlistItem;
			})
		);
	}
}
