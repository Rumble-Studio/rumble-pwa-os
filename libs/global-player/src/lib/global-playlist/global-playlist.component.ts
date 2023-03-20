import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { DEFAULT_GLOBAL_PLAYER_SETTINGS, GlobalPlayerServiceSettings } from '@rumble-pwa/mega-store';
import { VirtualPlaylistWithStreamStates } from '@rumble-pwa/player/services';
import { tap } from 'rxjs/operators';
import { GlobalPlayerService } from '../global-player.service';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-global-playlist',
	templateUrl: './global-playlist.component.html',
	styleUrls: ['./global-playlist.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalPlaylistComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	settings: GlobalPlayerServiceSettings = DEFAULT_GLOBAL_PLAYER_SETTINGS;
	state: VirtualPlaylistWithStreamStates | null = null;

	displayFavorite = true;

	constructor(
		//
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		public globalPlayerService: GlobalPlayerService,
		private elementRef: ElementRef
	) {
		super(_cdr, _layoutService, _activateRoute);

		// console.log('%cGlobalPlaylistComponent.constructor', 'color: #00f; font-weight: bold;');

		this.globalPlayerService.globalState$$
			.pipe(
				untilDestroyed(this),
				tap((globalState) => {
					this.settings = globalState.settings;
					this.state = globalState.state;

					if (this.settings.playbar.collapsed && !this.settings.playlist.collapsed) {
						// if the playbar is collapsed and the playlist is not collapsed,
						this.elementRef.nativeElement.style.maxHeight = '100%';
					} else {
						this.elementRef.nativeElement.style.maxHeight = 'calc( 100% - 100px)';
					}

					this._check();
				})
			)
			.subscribe();
	}

	notImplemented(...args: any[]) {
		console.error('Not implemented', args);
	}

	collapse() {
		this.globalPlayerService.updateSettings({
			playlist: {
				collapsed: true,
			},
		});
	}

	processDropTrackEvent(event: any) {
		console.log('processDropTrackEvent', event);
	}
}
