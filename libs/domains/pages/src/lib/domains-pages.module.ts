import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { DomainItemPageComponent } from './domain-item-page/domain-item-page.component';
import { DomainListPageComponent } from './domain-list-page/domain-list-page.component';

export const domainsPagesRoutes: Route[] = [
	{
		path: '',
		component: DomainListPageComponent,
	},
	{
		path: ':id',
		component: DomainItemPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(domainsPagesRoutes),
		TrackClickDirective,
	],
})
export class DomainsPagesModule {}
