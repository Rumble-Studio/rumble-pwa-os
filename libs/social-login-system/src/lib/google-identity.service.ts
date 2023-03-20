import { Injectable } from '@angular/core';
import { JavascriptService } from '@rumble-pwa/utils';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { AuthService } from '@rumble-pwa/auth-system';

declare let google: any;

@Injectable({
	providedIn: 'root',
})
export class GoogleIdentityService {
	apiGoogleLink = 'https://accounts.google.com/gsi/client';

	// Sebastien
	// clientId =
	//   '537176525920-e1opunquejgcroaubecka17dhq4atu52.apps.googleusercontent.com';

	// official rumble dev
	clientId = '906694942257-ao70q995rjigc518jjnscf651641i5mm.apps.googleusercontent.com';

	constructor(
		private javascriptService: JavascriptService,
		private notificationsService: NotificationsService,
		private authService: AuthService
	) {}

	handleCredentialResponse(response: any) {
		// console.log('[googleIdentityService](handleCredentialResponse)', {
		//   response,
		// });
		const token = response.credential;
		if (token) {
			this.authService.loginWithGoogleToken(token).subscribe();
		}
	}

	loadGoogleApiScript(showButton = true, showModal = false) {
		return;
		// // console.log('[googleIdentityService](loadGoogleApiScript)', 'start');
		// this.javascriptService.loadScript(this.clientId, this.apiGoogleLink, () => {
		//   // console.log(
		//   //   '[googleIdentityService](loadGoogleApiScript)',
		//   //   'script loaded'
		//   // );

		//   google.accounts.id.initialize({
		//     client_id: this.clientId,
		//     callback: (response: any) => this.handleCredentialResponse(response),
		//   });

		//   if (showModal) google.accounts.id.prompt();

		//   if (showButton)
		//     google.accounts.id.renderButton(
		//       document.getElementById('googleButtonDiv'),
		//       { theme: 'outline', size: 'large' }
		//     );
		// });
	}
}
