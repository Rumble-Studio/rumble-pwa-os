import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CdkTreeModule } from '@angular/cdk/tree';
import { MatTreeModule } from '@angular/material/tree';
import { RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GroupItemFileComponent, GroupItemGenericComponent, GroupItemUserComponent } from '@rumble-pwa/groups/ui';
import { GroupPropertiesPromptComponent } from './elements/group-properties-prompt/group-properties-prompt.component';
const COMPONENTS = [GroupPropertiesPromptComponent];
@NgModule({
	imports: [
		CommonModule,
		RouterModule,
		DesignSystemModule,
		MatTreeModule,
		CdkTreeModule,

		//
		GroupItemGenericComponent,
		GroupItemFileComponent,
		GroupItemUserComponent,
		TrackClickDirective,
	],
	declarations: COMPONENTS,
	exports: COMPONENTS,
})
export class GroupsElementsModule {}
