import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { VirtualPlayerService, VirtualPlaylistWithStreamStates } from '@rumble-pwa/player/services';
import { VirtualPlaybarComponent } from '@rumble-pwa/player/ui';
import { TracksRepository } from '@rumble-pwa/tracks/state';
import { Bs$$ } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

const virtualPlaylistIdPrefix = 'vpp-';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-playlist-player',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualPlaybarComponent,
		MatButtonModule,
		TrackClickDirective,
	],
	templateUrl: './playlist-player.component.html',
	styleUrls: ['./playlist-player.component.scss'],
})
export class PlaylistPlayerComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	@Input()
	listeningMessage?: string;

	playlistState: VirtualPlaylistWithStreamStates | null = null;

	playlistId$$ = new Bs$$<string>();
	@Input()
	public set playlistId(newPlaylistId) {
		this.playlistId$$.value = newPlaylistId;
	}
	public get playlistId() {
		return this.playlistId$$.value;
	}

	@Input() customPictureSrc?: string;

	private _formCustomisationDetails?: FormCustomisationDetails;
	@Input()
	public set formCustomisationDetails(newFormCustomisationDetails) {
		this._formCustomisationDetails = newFormCustomisationDetails;
		this.customPictureSrc = this.customPictureSrc ?? newFormCustomisationDetails?.customPlayerAvatarSrc;
	}

	public get formCustomisationDetails() {
		return this._formCustomisationDetails;
	}

	hasActiveTracks = false;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _virtualPlayerService: VirtualPlayerService,
		private _playlistsManagementService: PlaylistsManagementService,
		private _tracksRepository: TracksRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// Process playlistId to fill virtual player service and get playlist state
		this.playlistId$$.$$.pipe(
			untilDestroyed(this),
			switchMap((playlistId) => {
				if (!playlistId) {
					return of(null);
				}
				return this._tracksRepository.convertPlaylistIdToVirtualPlaylist$(
					playlistId,
					virtualPlaylistIdPrefix + playlistId,
					true
				);
			}),
			switchMap((virtualPlaylist) => {
				if (!virtualPlaylist) return of(null);
				// upsert virtual playlist to virtual player service
				return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylist);
			}),
			tap((playlistState) => {
				this.playlistState = playlistState;
				this._check();
			})
		).subscribe();

		// check if there is active tracks
		this.playlistId$$.$.pipe(
			switchMap((playlistId) => {
				if (!playlistId) return of([]);
				return this._tracksRepository.getTracks$(playlistId).pipe();
			}),
			tap((tracks) => {
				this.hasActiveTracks = tracks.some((track) => track.active);
				this._check();
			})
		).subscribe();
	}
}
