import { Component } from '@angular/core';

@Component({
	selector: 'rumble-pwa-plan-list',
	templateUrl: './plan-list.component.html',
	styleUrls: ['./plan-list.component.scss'],
})
export class PlanListComponent {
	// grantMappings = PLANS.map((plan) => plan.grantMapping);
	grantMappings = ['basic', 'plus', 'advanced'];
}
