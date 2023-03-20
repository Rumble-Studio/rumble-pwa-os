import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { LayoutRepository } from '@rumble-pwa/layout/state';
import { UsersRepository } from '@rumble-pwa/users/state';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-verify-email',
	templateUrl: './verify-email.component.html',
	styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent {
	public currentEmail?: string;
	emailRequested = false;
	constructor(
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _layoutRepository: LayoutRepository,
		private _router: Router
	) {
		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((profile) => {
					if (!profile) return;
					this.currentEmail = profile.email;
					if (profile.emailValidated) {
						if (profile.isGuestOnly) {
							this._router.navigate(['/guest']);
						} else {
							this._router.navigate(['/']);
						}
					}
				})
			)
			.subscribe();
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

	public askForNewValidationEmail() {
		if (!this.currentEmail) {
			this._notificationsService.error('Email is missing');
			return;
		}
		this.emailRequested = true;
		this._usersRepository.sendEmailValidation(this.currentEmail);
	}
}
