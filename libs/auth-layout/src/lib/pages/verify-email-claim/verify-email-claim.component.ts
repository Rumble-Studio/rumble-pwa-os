import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { LayoutRepository } from '@rumble-pwa/layout/state';
import { UsersRepository } from '@rumble-pwa/users/state';
import { getRouteQueryParam$ } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-verify-email-claim',
	templateUrl: './verify-email-claim.component.html',
	styleUrls: ['./verify-email-claim.component.scss'],
})
export class VerifyEmailClaimComponent {
	success?: string;
	error?: string;
	redirectUrl?: string;

	currentEmail?: string;

	constructor(
		private activatedRoute: ActivatedRoute,
		private usersRepository: UsersRepository,
		private cdr: ChangeDetectorRef,
		private notificationsService: NotificationsService,
		private router: Router,
		private _layoutRepository: LayoutRepository
	) {
		getRouteQueryParam$(this.activatedRoute, 'success')
			.pipe(
				untilDestroyed(this),
				tap((success) => {
					this.success = success || this.success;
				})
			)
			.subscribe();

		getRouteQueryParam$(this.activatedRoute, 'error')
			.pipe(
				untilDestroyed(this),
				tap((error) => {
					this.error = error || this.error;
				})
			)
			.subscribe();

		getRouteQueryParam$(this.activatedRoute, 'redirectUrl')
			.pipe(
				untilDestroyed(this),
				tap((redirectUrl) => {
					this.redirectUrl = redirectUrl || this.redirectUrl;
					if (redirectUrl) {
						this.router.navigate([redirectUrl]);
					}
				})
			)
			.subscribe();

		this.usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((profile) => {
					if (!profile) return;
					this.currentEmail = profile.email;
				}),
				tap(() => this.check())
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

	askForNewValidationEmail() {
		if (!this.currentEmail) {
			this.notificationsService.error('Email is missing');
			return;
		}
		this.usersRepository.sendEmailValidation(this.currentEmail);
		this.notificationsService.success('New email has been sent to ' + this.currentEmail);
	}

	private check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
