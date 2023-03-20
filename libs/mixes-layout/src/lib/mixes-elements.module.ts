import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ExplanationComponent } from '@rumble-pwa/atomic-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { ExportItemComponent } from '@rumble-pwa/exports/ui';
import { FormsElementsModule } from '@rumble-pwa/forms-layout';
import { GroupsElementsModule } from '@rumble-pwa/groups-layout';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { FilePlayerComponent } from '@rumble-pwa/player/specialised';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { UtilsModule } from '@rumble-pwa/utils';
import { MixExportsPromptComponent } from './elements/mix-exports-prompt/mix-exports-prompt.component';
import { MixListComponent } from './elements/mix-list/mix-list.component';
import { MixRequestExportPromptComponent } from './elements/mix-request-export-prompt/mix-request-export-prompt.component';

const COMPONENTS = [
	//
	MixListComponent,
	MixExportsPromptComponent,
	MixRequestExportPromptComponent,
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule,
		DesignSystemModule,
		GroupsElementsModule,
		FormsElementsModule,
		UtilsModule,
		VirtualPlaylistComponent,
		ExportItemComponent,
		GroupItemGenericComponent,
		ObjectListComponent,
		ObjectColumnComponent,
		ExplanationComponent,
		FilePlayerComponent,
		TrackClickDirective,
	],
	declarations: [...COMPONENTS],
	exports: COMPONENTS,
})
export class MixesElementsModule {}
