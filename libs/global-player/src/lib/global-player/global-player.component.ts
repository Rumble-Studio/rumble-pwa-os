import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { DEFAULT_GLOBAL_PLAYER_SETTINGS, GlobalPlayerServiceSettings } from '@rumble-pwa/mega-store';
import { VirtualPlaylist, VirtualPlaylistWithStreamStates } from '@rumble-pwa/player/services';
import { tap } from 'rxjs/operators';
import { GlobalPlayerService } from '../global-player.service';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-global-player',
	templateUrl: './global-player.component.html',
	styleUrls: ['./global-player.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalPlayerComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	settings: GlobalPlayerServiceSettings = DEFAULT_GLOBAL_PLAYER_SETTINGS;
	playlist: VirtualPlaylist | null = null;
	state: VirtualPlaylistWithStreamStates | null = null;

	@Output() resetPosition = new EventEmitter<void>();

	constructor(
		//
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		public globalPlayerService: GlobalPlayerService,
		private elementRef: ElementRef
	) {
		super(_cdr, _layoutService, _activateRoute);

		console.log('%c[GlobalPlayerComponent](constructor)', 'color:red');

		this.globalPlayerService.globalState$$
			.pipe(
				untilDestroyed(this),
				tap((globalState) => {
					this.playlist = globalState.playlist;
					this.settings = globalState.settings;
					this.state = globalState.state;

					if (this.settings.playbar.collapsed) {
						this.restoreOriginalPosition();
					}

					this.elementRef.nativeElement.style.height = 'auto';
					this.elementRef.nativeElement.style.top = 'unset';

					// Handle the situation where the player was resized
					// The customHeight is updated via dash.component when a resize ends.
					if (!this.settings.playlist.collapsed) {
						this.elementRef.nativeElement.style.height = this.settings.customHeight
							? this.settings.customHeight + 'px'
							: '300px';
					}

					this._check();
				})
			)
			.subscribe();
	}

	openPlaybar() {
		console.log('open play bar');
		this.globalPlayerService.updateSettings({
			playbar: {
				collapsed: false,
			},
		});
	}

	restoreOriginalPosition() {
		this.resetPosition.emit();
	}
}
