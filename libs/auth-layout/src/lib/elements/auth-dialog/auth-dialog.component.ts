import { animate, style, transition, trigger } from '@angular/animations';
import { AfterViewChecked, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '@rumble-pwa/auth-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { GoogleIdentityService } from '@rumble-pwa/social-login-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { filter, take, tap } from 'rxjs/operators';

export interface AuthDialogData {
	hideRegisterTab?: boolean;
	email?: string;
	canSignInWithAPassword?: boolean;
	registerMode?: boolean;
	redirectUrl?: string;
	closeDialogWhenConnected: boolean;
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-auth-dialog',
	templateUrl: './auth-dialog.component.html',
	styleUrls: ['./auth-dialog.component.scss'],
	animations: [
		trigger('fadeAnimation', [
			transition('false=>true', [style({ opacity: 0 }), animate('1000ms', style({ opacity: 1 }))]),
			transition('true=>false', [animate('1000ms 1000ms', style({ opacity: 0 }))]),
		]),
	],
})
export class AuthDialogComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	showRegisterTab = true;
	canSignInWithAPassword = true;
	defaultEmail?: string;
	registerMode = false;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _authService: AuthService, // to ask for reset password TODO: move this reset function to user repo
		private _dialogRef: MatDialogRef<AuthDialogComponent, boolean>,
		private _googleIdentityService: GoogleIdentityService,
		private _usersRepository: UsersRepository,
		@Inject(MAT_DIALOG_DATA)
		public data: AuthDialogData
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this._usersRepository.isConnected$$
			.pipe(
				untilDestroyed(this),
				filter((isConnected) => isConnected),
				take(1),
				tap(() => {
					if (data.closeDialogWhenConnected) {
						this.dismiss();
					}
				})
			)
			.subscribe();

		this.showRegisterTab = !this.data.hideRegisterTab;
		this.defaultEmail = this.data.email;
		this.canSignInWithAPassword = this.data.canSignInWithAPassword ?? true;
		this.registerMode = this.data.registerMode ?? false;
	}

	dismiss() {
		this._dialogRef.close(false);
	}

	setRegisterMode(value: boolean) {
		this.registerMode = value;
	}

	sendPasswordLessConnectionLink() {
		// const currentUrl = this.router.url;
		if (this.data.email) {
			this._authService.resetPasswordRequest(this.data.email, false, this.data.redirectUrl);
		}
		// this.notificationsService.success('Check your mailbox!')
		this.dismiss();
	}
}
