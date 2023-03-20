import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ExplanationComponent } from '@rumble-pwa/atomic-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FormsElementsModule } from '@rumble-pwa/forms-layout';
import { GlobalPlayerModule } from '@rumble-pwa/global-player';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import {
	BrandsAsSourceComponent,
	FavoritesAsSourceComponent,
	FilesAsSourceComponent,
	FormsAsSourceComponent,
} from '@rumble-pwa/player/sources';
import { VirtualPlaybarComponent, VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { RecordActionsComponent } from '@rumble-pwa/record/ui';
import { MixesElementsModule } from './mixes-elements.module';
import { MixItemPageComponent } from './pages/mix-item-page/mix-item-page.component';
import { MixListPageComponent } from './pages/mix-list-page/mix-list-page.component';

const routes = [
	{
		path: '',
		component: MixListPageComponent,
	},
	{
		path: ':mixId',
		component: MixItemPageComponent,
	},
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
		MixesElementsModule,
		GlobalPlayerModule,
		FormsElementsModule,
		FavoritesAsSourceComponent,
		VirtualPlaybarComponent,
		VirtualPlaylistComponent,
		FormsAsSourceComponent,
		FilesAsSourceComponent,
		RecordActionsComponent,
		ExplanationComponent,
		BrandsAsSourceComponent,
		TrackClickDirective,
	],
	declarations: [MixListPageComponent, MixItemPageComponent],
})
export class MixesLayoutModule {}
