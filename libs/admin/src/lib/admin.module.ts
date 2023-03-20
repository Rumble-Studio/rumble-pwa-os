import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { RouterModule } from '@angular/router';

const routes = [
	{
		path: '',
		component: AdminDashboardComponent,
	},
];
@NgModule({
	imports: [CommonModule, DesignSystemModule, RouterModule.forChild(routes)],
	declarations: [AdminDashboardComponent],
})
export class AdminModule {}
