import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Route, RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { BrandItemPageComponent } from './brand-item-page/brand-item-page.component';
import { BrandListPageComponent } from './brand-list-page/brand-list-page.component';

export const brandsPageRoutes: Route[] = [
	{
		path: '',
		component: BrandListPageComponent,
	},
	{
		path: ':id',
		component: BrandItemPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(brandsPageRoutes),
		MatTableModule,
		MatButtonModule,
		ObjectColumnComponent,
		ObjectListComponent,
		TrackClickDirective,
	],
})
export class BrandsPageModule {}
