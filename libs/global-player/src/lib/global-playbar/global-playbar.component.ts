import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { DEFAULT_GLOBAL_PLAYER_SETTINGS, GlobalPlayerServiceSettings } from '@rumble-pwa/mega-store';
import { VirtualPlaylist, VirtualPlaylistWithStreamStates } from '@rumble-pwa/player/services';
import { tap } from 'rxjs/operators';
import { GlobalPlayerService } from '../global-player.service';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-global-playbar',
	templateUrl: './global-playbar.component.html',
	styleUrls: ['./global-playbar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalPlaybarComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	settings: GlobalPlayerServiceSettings = DEFAULT_GLOBAL_PLAYER_SETTINGS;
	playlist: VirtualPlaylist | null = null;
	state: VirtualPlaylistWithStreamStates | null = null;

	displayFavorite = true;

	customColors = ['#fae285', '#f5ca1b'];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		public globalPlayerService: GlobalPlayerService
	) {
		super(_cdr, _layoutService, _activateRoute);

		this.globalPlayerService.globalState$$
			.pipe(
				untilDestroyed(this),
				tap((state) => {
					this.playlist = state.playlist;
					this.settings = state.settings;
					this.state = state.state;
					this._check();
				})
			)
			.subscribe();
	}

	togglePlaylistCollapse() {
		this.globalPlayerService.updateSettings({
			playlist: {
				collapsed: !this.settings.playlist.collapsed,
			},
		});
	}

	collapse() {
		this.globalPlayerService.updateSettings({
			playbar: {
				collapsed: true,
			},
		});
	}

	processSeekMultiEvent(multiSeekEvent: { indexToSeek: number; percentageOfSongToSeek: number; play: boolean }) {
		this.globalPlayerService.processSeekMultiEvent(multiSeekEvent);
	}

	togglePlay() {
		this.globalPlayerService.togglePlay();
	}
}
