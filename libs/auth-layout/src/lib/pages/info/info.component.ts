import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService, AuthTokenProps, AuthTokensRepository } from '@rumble-pwa/auth-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Attr } from '@rumble-pwa/utils';
import jwt_decode from 'jwt-decode';
import { AuthDialogService } from '../../auth-dialog.service';

@Component({
	selector: 'rumble-pwa-info',
	templateUrl: './info.component.html',
	styleUrls: ['./info.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoComponent {
	token: string | null = '';
	connected = false;
	decoded: Attr = {};
	due: Date | null = null;
	allowPasswordChange = false;

	constructor(
		private authService: AuthService,
		private cdr: ChangeDetectorRef,
		private authDialogService: AuthDialogService,
		private _usersRepository: UsersRepository,
		private _authTokensRepository: AuthTokensRepository
	) {
		this._authTokensRepository.authTokenProps$.subscribe(({ token }) => {
			this.token = token;
			this.connected = !!token;
			this.decoded = token ? jwt_decode(token) : {};
			this.due = this.decoded?.exp ? new Date((this.decoded.exp as number) * 1000) : null;
			this.allowPasswordChange = this.decoded?.allowPasswordChange
				? (this.decoded.allowPasswordChange as boolean)
				: false;
			this.cdr.markForCheck();
		});
	}

	logout() {
		this.authService.logout(false);
		this.cdr.markForCheck();
	}

	openAuthDialog() {
		this.authDialogService.openAuthDialog();
	}
}
