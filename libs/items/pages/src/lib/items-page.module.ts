import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Route, RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { ItemPageComponent } from './item-page/item-page.component';

export const itemsPageRoutes: Route[] = [
	{
		path: ':itemId',
		component: ItemPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(itemsPageRoutes),
		MatTableModule,
		MatButtonModule,
		ObjectColumnComponent,
		ObjectListComponent,
		TrackClickDirective,
	],
})
export class ItemsPageModule {}
