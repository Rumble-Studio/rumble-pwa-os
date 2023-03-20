import { Component } from '@angular/core';
import { gitLogs } from '../../config/gitLogs.config';

@Component({
	selector: 'rumble-pwa-admin-dashboard',
	templateUrl: './admin-dashboard.component.html',
	styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent {
	public gitLogs = gitLogs;
}
