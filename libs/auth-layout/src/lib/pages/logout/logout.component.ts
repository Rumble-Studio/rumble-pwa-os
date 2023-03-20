import { Component } from '@angular/core';

import { AuthService } from '@rumble-pwa/auth-system';

@Component({
	selector: 'rumble-pwa-logout',
	templateUrl: './logout.component.html',
	styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent {
	constructor(private authService: AuthService) {
		this.authService.logout(true);
	}
}
