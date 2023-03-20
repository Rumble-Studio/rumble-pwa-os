/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService, StepAttribute } from '@rumble-pwa/forms-system';
import { Form } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';
import { AttrElement } from '@rumble-pwa/utils';
import { NEVER } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { GuestGenericComponent } from '../guest-generic/guest-generic.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-guest-welcome-step',
	templateUrl: './guest-welcome-step.component.html',
	styleUrls: ['./guest-welcome-step.component.scss', '../guest-generic/guest-generic.component.scss'],
})
export class GuestWelcomeStepComponent extends GuestGenericComponent {
	checkingAccount = false;
	userIsLoading = false;

	connected = false;

	connexionEmailSent?: string;

	constructor(
		notificationsService: NotificationsService,
		private authService: AuthService,
		private _usersRepository: UsersRepository,
		private _formsManagementService: FormsManagementService,
		private _router: Router,
		public cdr: ChangeDetectorRef
	) {
		super(notificationsService);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public processChange(value: AttrElement, stepAttribute: StepAttribute) {
		if (!this.step) return;
		if (this.previewMode) {
			return this.goNext();
		}
		if (!value) return;
		if (typeof value != 'string') return;

		this.checkingAccount = true;

		const userEmail = value;

		const formId = this.step?.formId;
		if (!formId) {
			this.notificationsService.warning(
				'An error occured while verifying your email, please refresh the page and try again.'
			);
			console.error('No formId available');
			return;
		}
		const form: Form | undefined = this._formsManagementService.get(formId);
		if (!form) {
			this.notificationsService.warning(
				'An error occured while verifying your email, please refresh the page and try again.'
			);
			console.error('No form available');
			return;
		}
		const formOwner = this._usersRepository.get(form?.ownerId);

		this.authService
			.checkAccountWithEmail$(userEmail)
			.pipe(
				untilDestroyed(this),
				catchError((a) => {
					this.connected = false;
					this.checkingAccount = false;
					this.cdr.detectChanges();
					return NEVER;
				}),
				switchMap((result: { email_exists: boolean; has_password?: boolean }) => {
					if (result.email_exists) {
						return this.authService
							.connectViaEmail$(userEmail, {
								redirectUrl: this._router.url,
								fromName: formOwner?.fullName,
								replyToEmail: formOwner?.emailValidated ? formOwner.email : undefined,
								replyToName: formOwner?.fullName,
								bodyMessage: 'To take part into "' + form.title + '" please click on the button below:',
								action: 'Open "' + form.title + '"',
								subject: 'Take part in "' + form.title + '"',
								title: 'Take part in "' + form.title + '"',
							})
							.pipe(
								tap(() => {
									this.connexionEmailSent = userEmail;
								})
							);
						// return this.authDialogService
						// 	.openAuthDialog({
						// 		hideRegisterTab: true,
						// 		email: userEmail,
						// 		canSignInWithAPassword: !!result.has_password,
						// 		redirectUrl: this.router.url,
						// 		closeDialogWhenConnected: false,
						// 	})
						// 	.afterClosed();
					} else {
						return this.authService.createOpenAccountWithEmail$(userEmail, true, false).pipe(
							map((registrationResult) => {
								return !!registrationResult.access_token;
							})
						);
					}
				}),
				tap((connected) => {
					this.connected = !!connected;
					this.checkingAccount = false;
					this.cdr.detectChanges();
				})
			)
			.subscribe();
	}

	logout() {
		if (this.previewMode) {
			this.notificationsService.info("You can't do this action in preview mode.");
			return;
		}

		this.notificationsService.confirm('Are you sure you want to log out?').subscribe((confirmation) => {
			if (confirmation) {
				this.authService.logout(false, true);
			}
		});
	}

	public clearConnexionEmailSent() {
		this.connexionEmailSent = undefined;
	}
}
