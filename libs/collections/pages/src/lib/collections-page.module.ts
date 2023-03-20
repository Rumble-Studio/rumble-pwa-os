import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Route, RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { CollectionItemPageComponent } from './collection-item-page/collection-item-page.component';
import { CollectionsListPageComponent } from './collections-list-page/collections-list-page.component';

export const collectionsPageRoutes: Route[] = [
	{
		path: '',
		component: CollectionsListPageComponent,
	},
	{
		path: ':collectionId',
		component: CollectionItemPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(collectionsPageRoutes),
		MatTableModule,
		MatButtonModule,
		ObjectColumnComponent,
		ObjectListComponent,
		TrackClickDirective,
	],
})
export class CollectionsPageModule {}
