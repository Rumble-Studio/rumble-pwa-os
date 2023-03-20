import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LayoutRepository } from '@rumble-pwa/layout/state';
import { DEFAULT_GLOBAL_PLAYER_SETTINGS, GlobalPlayerServiceSettings } from '@rumble-pwa/mega-store';
import { VirtualPlayerService, VirtualPlaylist, VirtualPlaylistWithStreamStates } from '@rumble-pwa/player/services';
import { getRouteQueryParam$, NestedPartial } from '@rumble-pwa/utils';
import { merge } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class GlobalPlayerService {
	debug = false;
	playlist$$: BehaviorSubject<VirtualPlaylist | null> = new BehaviorSubject<VirtualPlaylist | null>(null);
	settings$$ = new BehaviorSubject<GlobalPlayerServiceSettings>(DEFAULT_GLOBAL_PLAYER_SETTINGS);
	playlistState$$: BehaviorSubject<VirtualPlaylistWithStreamStates | null> =
		new BehaviorSubject<VirtualPlaylistWithStreamStates | null>(null);
	globalState$$ = new BehaviorSubject<{
		playlist: VirtualPlaylist | null;
		settings: GlobalPlayerServiceSettings;
		state: VirtualPlaylistWithStreamStates | null;
	}>({
		playlist: null,
		settings: DEFAULT_GLOBAL_PLAYER_SETTINGS,
		state: null,
	});

	private _playlistId?: string;
	public get playlistId() {
		return this._playlistId;
	}
	public set playlistId(newPlaylistId) {
		if (newPlaylistId === this._playlistId) return;
		this._playlistId = newPlaylistId;
	}

	sourceDestroyer$ = new Subject<void>();

	constructor(
		//
		private activatedRoute: ActivatedRoute,
		private _virtualPlayerService: VirtualPlayerService,
		private _layoutRepository: LayoutRepository
	) {
		getRouteQueryParam$(this.activatedRoute, 'debug')
			.pipe(
				tap((debug) => {
					this.debug = !!debug;
				})
			)
			.subscribe();

		// merge playlist$, settings$, and state$ into one object: globalState$
		combineLatest([this.playlist$$, this.settings$$, this.playlistState$$])
			.pipe(
				tap(([playlist, settings, state]) => {
					this.globalState$$.next({
						playlist,
						settings,
						state,
					});
				})
			)
			.subscribe();

		// let virtual player service be aware of the last playlist
		this.playlist$$
			.pipe(
				switchMap((playlist) => {
					// clearing VirtualPlaylistPlayer from previous playlist referenced by this GlobalPlayerService
					if (this.playlistId && this.playlistId !== playlist?.id) {
						this._virtualPlayerService.clearVirtualPlaylist(this.playlistId);
						this.playlistId = playlist?.id;
					}
					// setting new playlist
					if (playlist) {
						this.playlistId = playlist.id;
						return this._virtualPlayerService.upsertVirtualPlaylist$(playlist);
					}
					return of(null);
				}),
				tap((state) => {
					this.playlistState$$.next(state);
				})
			)
			.subscribe();
	}

	// Player State & Settings

	setVirtualPlaylist(
		virtualPlaylist: VirtualPlaylist,
		somePlaylistDetails?: NestedPartial<GlobalPlayerServiceSettings> | null
	) {
		this.playlist$$.next(virtualPlaylist);
		if (somePlaylistDetails) {
			this.updateSettings(somePlaylistDetails);
		}
		this._layoutRepository.setLayoutProps({
			displayGlobalPlayer: true,
		});
	}

	updateSettings(somePlaylistDetails?: NestedPartial<GlobalPlayerServiceSettings>) {
		const newSettings: GlobalPlayerServiceSettings = DEFAULT_GLOBAL_PLAYER_SETTINGS;
		const currentSettings = this.settings$$.value;
		merge(newSettings, currentSettings, somePlaylistDetails);
		this.settings$$.next(newSettings);
	}

	public replacePlaylistSource(
		newPlaylistSource$: Observable<{
			virtualPlaylist: VirtualPlaylist | null;
			playlistSettings: NestedPartial<GlobalPlayerServiceSettings> | null;
		}>
	) {
		this.sourceDestroyer$.next();
		newPlaylistSource$
			.pipe(
				takeUntil(this.sourceDestroyer$),
				tap(({ virtualPlaylist, playlistSettings }) => {
					if (virtualPlaylist && playlistSettings) {
						this.setVirtualPlaylist(virtualPlaylist, playlistSettings);
					}
				})
			)
			.subscribe();
	}

	public togglePlay() {
		const virtualPlaylistId = this.playlist$$.value?.id;
		if (virtualPlaylistId) {
			if (this.globalState$$.value.state?.representativeState.playing)
				this._virtualPlayerService.pausePlaylist(virtualPlaylistId, false);
			else {
				this._virtualPlayerService.resumePlaylist(virtualPlaylistId);
			}
		}
	}

	public processSeekMultiEvent(multiSeekEvent: { indexToSeek: number; percentageOfSongToSeek: number; play: boolean }) {
		const virtualPlaylistId = this.playlist$$.value?.id;
		if (!virtualPlaylistId) return;
		this._virtualPlayerService.seekTrackAtPercentage(
			virtualPlaylistId,
			multiSeekEvent.indexToSeek,
			multiSeekEvent.percentageOfSongToSeek
		);
		if (multiSeekEvent.play) {
			this._virtualPlayerService.resumePlaylist(virtualPlaylistId);
		}
	}
}
