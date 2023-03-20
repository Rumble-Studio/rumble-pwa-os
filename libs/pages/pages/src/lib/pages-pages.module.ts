import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { PageItemPageComponent } from './page-item-page/page-item-page.component';
import { PageListPageComponent } from './page-list-page/page-list-page.component';

export const pagesPagesRoutes: Route[] = [
	{
		path: '',
		component: PageListPageComponent,
	},
	{
		path: ':id',
		component: PageItemPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(pagesPagesRoutes),
		TrackClickDirective,
	],
})
export class PagesPagesModule {}
