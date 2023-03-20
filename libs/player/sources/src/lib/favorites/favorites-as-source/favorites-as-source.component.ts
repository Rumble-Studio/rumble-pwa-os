import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import {
	VirtualPlayerService,
	VirtualPlaylist,
	VirtualPlaylistWithStreamStates,
	VirtualTrack,
} from '@rumble-pwa/player/services';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { TracksRepository } from '@rumble-pwa/tracks/state';
import { FavoriteObject } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { cloneDeep, flatten } from 'lodash';
import { combineLatest, Observable, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-favorites-as-source',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualPlaylistComponent,
		TrackClickDirective,
	],
	templateUrl: './favorites-as-source.component.html',
	styleUrls: ['./favorites-as-source.component.scss'],
})
export class FavoritesAsSourceComponent
	extends LayoutSizeAndCheck
	implements HasLayoutSize, CanCheck, CanBeDebugged, OnDestroy
{
	state: VirtualPlaylistWithStreamStates | null = null;
	virtualPlaylistId = 'favorites-as-source';
	@Input() connectDropTo: string[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _usersRepository: UsersRepository,
		private _filesRepository: FilesRepository,
		private _virtualPlayerService: VirtualPlayerService,
		private _tracksRepository: TracksRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this._usersRepository.connectedUserFavorite$$
			.pipe(
				switchMap((favorites) => {
					if (favorites) return this._convertFavoritesToVirtualTracks$(favorites);
					return of([]);
				}),
				switchMap((virtualTracks) => {
					if (virtualTracks.length === 0) {
						return of(null);
					}
					const pictureSrcs = flatten(virtualTracks.map((vt) => vt.details?.pictureSrcs ?? []));

					const virtualPlaylist: VirtualPlaylist = {
						id: this.virtualPlaylistId,
						virtualTracks,
						details: {
							pictureSrcs: [...new Set(pictureSrcs)],
						},
					};
					return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylist);
				}),
				untilDestroyed(this),
				map((state) => {
					this.state = cloneDeep(state);
					this._check();
				})
			)
			.subscribe();
	}

	private _convertFavoritesToVirtualTracks$(favorites: FavoriteObject[]): Observable<VirtualTrack[]> {
		const virtualTracks = favorites.map((favorite) => {
			switch (favorite.objectKind) {
				case 'file': {
					return this._filesRepository.convertFileIdToVirtualTrack$(favorite.objectId, this.virtualPlaylistId);
				}
				case 'playlist': {
					return this._tracksRepository
						.convertPlaylistIdToVirtualPlaylist$(favorite.objectId, this.virtualPlaylistId)
						.pipe(
							map((virtualPlaylist: VirtualPlaylist) => {
								console.log('_convertFavoritesToVirtualTracks$', 'converted playlist', virtualPlaylist);

								const asOneVirtualTrack: VirtualTrack = {
									files: flatten(
										virtualPlaylist.virtualTracks.filter((vt) => vt.active).map((vt) => vt.files)
									),
									id: 'fav-' + virtualPlaylist.id,
									active: true,
									details: virtualPlaylist.details,
									source: {
										kind: 'playlist',
										id: favorite.objectId,
									},
									transcript: {
										canEditTranscript: false,
										editedTranscript:
											virtualPlaylist.virtualTracks
												.filter((t) => t.active)
												.map((t) => t.transcript?.editedTranscript)
												.filter((child): child is string => !!child)
												.join('\n') || undefined,
										originalTranscript:
											virtualPlaylist.virtualTracks
												.filter((t) => t.active)
												.map((t) => t.transcript?.originalTranscript)
												.filter((child): child is string => !!child)
												.join('\n') || undefined,
									},
								};
								console.log('_convertFavoritesToVirtualTracks$', 'asOneVirtualTrack', asOneVirtualTrack);

								return asOneVirtualTrack;
							})
						);
				}
				default:
					console.log('_convertFavoriteSToVirtualTracks', 'not implemented', favorite);
					return of(undefined);
			}
		});

		return combineLatest(virtualTracks).pipe(
			startWith([]),
			map((virtualTracks: (VirtualTrack | null | undefined)[]) =>
				virtualTracks
					.filter((virtualTrack): virtualTrack is VirtualTrack => !!virtualTrack)
					.map((virtualTrack, virtualTrackIndex) => {
						const updatedVirtualTracks: VirtualTrack = {
							...virtualTrack,
							id: virtualTrackIndex.toString(),
						};
						return updatedVirtualTracks;
					})
			)
		);
	}

	public processClickTrackEvent(virtualTrack: VirtualTrack) {
		console.log('processClickTrackEvent', 'not implemented', virtualTrack);
	}

	ngOnDestroy(): void {
		this._virtualPlayerService.clearVirtualPlaylist(this.virtualPlaylistId);
	}
}
