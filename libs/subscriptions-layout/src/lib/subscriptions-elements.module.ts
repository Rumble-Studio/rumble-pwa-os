import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ExplanationComponent } from '@rumble-pwa/atomic-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GroupsElementsModule } from '@rumble-pwa/groups-layout';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { UtilsModule } from '@rumble-pwa/utils';
import { PlanItemComponent } from './elements/plan-item/plan-item.component';
import { PlanListComponent } from './elements/plan-list/plan-list.component';
import { SubscriptionDeletePromptComponent } from './elements/subscription-delete-prompt/subscription-delete-prompt.component';
import { SubscriptionEditorComponent } from './elements/subscription-editor/subscription-editor.component';
import { SubscriptionListComponent } from './elements/subscription-list/subscription-list.component';

const COMPONENTS = [
	//
	SubscriptionDeletePromptComponent,
	SubscriptionEditorComponent,
	SubscriptionListComponent,
	PlanListComponent,
	PlanItemComponent,
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule,
		DesignSystemModule,
		GroupsElementsModule,
		UtilsModule,
		ExplanationComponent,
		GroupItemGenericComponent,
		TrackClickDirective,
	],
	declarations: COMPONENTS,
	exports: COMPONENTS,
})
export class SubscriptionsElementsModule {}
