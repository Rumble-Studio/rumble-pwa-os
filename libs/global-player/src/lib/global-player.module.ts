import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EditableModule } from '@ngneat/edit-in-place';
import { GenericTextEditorComponent, ResizableModule } from '@rumble-pwa/atomic-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { VirtualDetailsComponent, VirtualPlaylistComponent, VirtualSeekbarComponent } from '@rumble-pwa/player/ui';
import { GenericFavoriteComponent } from '@rumble-pwa/users/ui';
import { UtilsModule } from '@rumble-pwa/utils';
import { GlobalPlaybarComponent } from './global-playbar/global-playbar.component';
import { GlobalPlayerComponent } from './global-player/global-player.component';
import { GlobalPlaylistComponent } from './global-playlist/global-playlist.component';

const COMPONENTS = [GlobalPlayerComponent, GlobalPlaylistComponent, GlobalPlaybarComponent];

@NgModule({
	imports: [
		CommonModule,
		DesignSystemModule,
		EditableModule,
		UtilsModule,
		ResizableModule,
		VirtualPlaylistComponent,
		VirtualDetailsComponent,
		VirtualSeekbarComponent,
		GenericTextEditorComponent,
		GenericFavoriteComponent,
		TrackClickDirective,
	],
	declarations: COMPONENTS,
	exports: COMPONENTS,
})
export class GlobalPlayerModule {}
