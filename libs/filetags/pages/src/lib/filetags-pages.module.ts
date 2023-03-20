import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Route, RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FiletagListComponent } from '@rumble-pwa/filetags/ui';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { FiletagListPageComponent } from './filetag-list-page/filetag-list-page.component';
import { FiletagPageComponent } from './filetag-page/filetag-page.component';
export const filetagsPagesRoutes: Route[] = [
	{
		path: '',
		component: FiletagListPageComponent,
	},
	{
		path: ':id',
		component: FiletagPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(filetagsPagesRoutes),
		MatTableModule,
		MatButtonModule,
		FiletagListComponent,
		ObjectColumnComponent,
		ObjectListComponent,
		TrackClickDirective,
	],
	declarations: [
		//
		FiletagPageComponent,
		FiletagListPageComponent,
	],
})
export class FiletagsPagesModule {}
