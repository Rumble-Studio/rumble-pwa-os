import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GroupsElementsModule } from '@rumble-pwa/groups-layout';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { PlanItemPageComponent } from './pages/plan-item-page/plan-item-page.component';
import { PlanListPageComponent } from './pages/plan-list-page/plan-list-page.component';
import { SubscriptionItemPageComponent } from './pages/subscription-item-page/subscription-item-page.component';
import { SubscriptionListPageComponent } from './pages/subscription-list-page/subscription-list-page.component';
import { SubscriptionsElementsModule } from './subscriptions-elements.module';

const routes = [
	// AUTH GUARD IS APPLIED AT THE ROUTE LEVEL
	{
		path: '',
		component: SubscriptionListPageComponent,
	},
	{
		path: 'plans',
		component: PlanListPageComponent,
	},
	{
		path: 'plans/:grantMapping',
		component: PlanItemPageComponent,
	},
	{
		path: ':subscriptionId',
		component: SubscriptionItemPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
		SubscriptionsElementsModule,
		GroupsElementsModule,
		GroupItemGenericComponent,
		TrackClickDirective,
	],
	declarations: [
		//
		SubscriptionListPageComponent,
		SubscriptionItemPageComponent,
		PlanListPageComponent,
		PlanItemPageComponent,
	],
})
export class SubscriptionsLayoutModule {}
