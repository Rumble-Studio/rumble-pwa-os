import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ExportListPageComponent } from './export-list-page/export-list-page.component';
import { ExportPageComponent } from './export-page/export-page.component';

export const exportsPagesRoutes: Route[] = [
	{
		path: '',
		component: ExportListPageComponent,
	},
	{
		path: ':id',
		component: ExportPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(exportsPagesRoutes),
		TrackClickDirective,
	],
})
export class ExportsPagesModule {}
