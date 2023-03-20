import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@rumble-pwa/auth-system';
import { selectPersistStateInit } from '@datorama/akita';
import { take } from 'rxjs/operators';

@Component({
	selector: 'rumble-pwa-welcome',
	templateUrl: './welcome.component.html',
	styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
	constructor(private activatedRoute: ActivatedRoute, private authService: AuthService, private router: Router) {
		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				const accessToken = this.activatedRoute.snapshot.queryParamMap.get('token');
				const orderParam = this.activatedRoute.snapshot.queryParamMap.get('order');
				const redirectUrl = this.activatedRoute.snapshot.queryParamMap.get('redirectUrl');

				if (accessToken) {
					this.authService.loginWithToken(accessToken as string);

					if (redirectUrl) {
						this.router.navigate([redirectUrl]);
						return;
					}
					if (orderParam) {
						this.router.navigate(['/profile'], {
							queryParams: { order: orderParam },
						});
						return;
					}
					this.router.navigate(['/']);
				} else {
					if (redirectUrl) {
						this.router.navigate([redirectUrl]);
						return;
					}
					this.router.navigate(['/']);
				}
			});
	}
}
