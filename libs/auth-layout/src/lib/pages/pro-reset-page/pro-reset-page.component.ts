import { Component } from '@angular/core';
import { LayoutService } from '@rumble-pwa/utils';

@Component({
	selector: 'rumble-pwa-pro-reset-page',
	templateUrl: './pro-reset-page.component.html',
	styleUrls: ['./pro-reset-page.component.scss'],
})
export class ProResetPageComponent {
	layoutSize = 2;

	// _connected = false;
	// get connected() {
	// 	return this._connected;
	// }
	// set connected(connected: boolean) {
	// 	if (!connected) this.googleIdentityService.loadGoogleApiScript(false, true);
	// 	if (connected != this._connected) {
	// 		this._connected = connected;
	// 		if (connected) {
	// 			const redirectUrl = this.route.snapshot.queryParams['redirectUrl'] || '/dashboard';
	// 			this.authService.consumeRedirectCache('proresetpage', redirectUrl);
	// 		}
	// 	}
	// }
	constructor(
		// private authService: AuthService,
		private layoutService: LayoutService // private router: Router, // private route: ActivatedRoute, // private googleIdentityService: GoogleIdentityService
	) {
		// layout state
		this.layoutService.layoutSize$$.subscribe((value) => {
			this.layoutSize = value;
		});

		// // Connected state
		// this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
		// 	this.connected = isLoggedIn;
		// });
	}
}
