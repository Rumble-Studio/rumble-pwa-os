import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { SubscriptionsElementsModule } from '@rumble-pwa/subscriptions-layout';
@NgModule({
	imports: [CommonModule, RouterModule, DesignSystemModule, SubscriptionsElementsModule, TrackClickDirective],

	declarations: [],
})
export class BillingElementsModule {}
