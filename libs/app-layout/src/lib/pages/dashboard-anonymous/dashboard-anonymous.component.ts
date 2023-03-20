import { Component } from '@angular/core';
import { LayoutRepository } from '@rumble-pwa/layout/state';

@Component({
	selector: 'rumble-pwa-dashboard-anonymous',
	templateUrl: './dashboard-anonymous.component.html',
	styleUrls: ['./dashboard-anonymous.component.scss'],
})
export class DashboardAnonymousComponent {
	constructor(private _layoutRepository: LayoutRepository) {
		this._layoutRepository.setLayoutProps({
			displayHeader: false,
			displayBurgerMenu: false,
			displayFooter: false,
			displaySidebarLeft: false,
			displayGlobalPlayer: false,
			displaySidebarRight: false,
			loading: false,
			pageSegments: [],
			displayLogo: true,
		});
	}
}
