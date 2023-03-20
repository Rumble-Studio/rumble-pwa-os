import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DesignSystemModule } from '@rumble-pwa/design-system';

const routes: Routes = [
	// {
	// 	path: '',
	// 	component: SubscriptionListPageComponent,
	// },
	// {
	// 	path: 'roadmap',
	// 	component: PlanListPageComponent,
	// },
	// {
	// 	path: 'help',
	// 	component: PlanItemPageComponent,
	// },
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
		// SubscriptionsElementsModule,
	],
	declarations: [
		//
	],
})
export class InfoLayoutModule {}
