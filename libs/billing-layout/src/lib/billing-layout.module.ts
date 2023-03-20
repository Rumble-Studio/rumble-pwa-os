import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ExplanationComponent } from '@rumble-pwa/atomic-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { SubscriptionsElementsModule } from '@rumble-pwa/subscriptions-layout';
import { BillingPageComponent } from './pages/billing-page/billing-page.component';

const routes = [
	{
		path: '',
		component: BillingPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
		SubscriptionsElementsModule,
		ExplanationComponent,
		TrackClickDirective,
	],
	declarations: [BillingPageComponent],
})
export class BillingLayoutModule {}
