import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EditableModule } from '@ngneat/edit-in-place';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { ProfileItemComponent } from './pages/profile-layout/profile-item.component';

const routes = [
	{
		path: '',
		component: ProfileItemComponent,
	},
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		EditableModule,
		DesignSystemModule,
		FormsModule,
		ReactiveFormsModule,
		// standalone components:
		ProfileItemComponent,
		TrackClickDirective,
	],
	declarations: [],
})
export class ProfileLayoutModule {}
