import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { getRouteQueryParam$ } from '@rumble-pwa/utils';
import { combineLatest } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { AuthDialogService } from '../../auth-dialog.service';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-pro-connexion-form',
	templateUrl: './pro-connexion-form.component.html',
	styleUrls: ['./pro-connexion-form.component.scss'],
})
export class ProConnexionFormComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, AfterViewInit
{
	askForPassword = false;
	connexionFormGroup: FormGroup;

	@Input() preventRedirect = false;

	private _defaultEmail?: string;
	@Input()
	public set defaultEmail(v) {
		this._defaultEmail = v;
		if (v) {
			this.connexionFormGroup.patchValue({ email: v });
		}
	}

	public get defaultEmail() {
		return this._defaultEmail;
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _authService: AuthService,
		private _formBuilder: FormBuilder,
		private _router: Router,
		private _authDialogService: AuthDialogService,
		private _notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.connexionFormGroup = this._formBuilder.group({
			email: new FormControl(this.defaultEmail || '', {
				updateOn: 'change',
			}),
		});
	}

	onSubmit() {
		const userEmail = this.connexionFormGroup.controls.email.value;
		if (!userEmail) {
			this._notificationsService.warning('Please enter your email.');
			return;
		}

		this._authService
			.checkAccountWithEmail$(userEmail)
			.pipe(
				untilDestroyed(this),
				switchMap((result: { email_exists: boolean; has_password?: boolean }) => {
					return this._authDialogService
						.openAuthDialog({
							hideRegisterTab: true,
							email: userEmail,
							canSignInWithAPassword: result.email_exists ? !!result.has_password : true,
							registerMode: !result.email_exists,
							closeDialogWhenConnected: true,
						})
						.afterClosed();
				})
			)
			.subscribe();
	}

	ngAfterViewInit() {
		const email = this.connexionFormGroup.controls.email;

		const email$ = getRouteQueryParam$(this._activatedRoute, 'email').pipe(
			untilDestroyed(this),
			tap((emailInQuery) => {
				if (emailInQuery) {
					email.patchValue(emailInQuery.toLowerCase());
					this._check();
				}
			}),
			shareReplay({ refCount: true })
		);
		email$.subscribe();

		const autoCreateAccount$ = getRouteQueryParam$(this._activatedRoute, 'auto').pipe(untilDestroyed(this));
		combineLatest([email$, autoCreateAccount$])
			.pipe(
				untilDestroyed(this),
				tap(([email, autoCreateAccount]) => {
					if (autoCreateAccount && email) {
						this.createDirectAccountIfPossible(email);
					}
				})
			)
			.subscribe();
	}

	/**
	 * This function is called if autoCreateAccount is true in query parameters.
	 * This could occur from a hubspot form
	 * This will create a Host account (isGuestOnly = false)
	 * @param userEmail
	 */
	public createDirectAccountIfPossible(userEmail: string) {
		if (!userEmail) {
			this._notificationsService.warning('Please enter your email.');
			return;
		}

		this._authService
			.checkAccountWithEmail$(userEmail)
			.pipe(
				switchMap((result: { email_exists: boolean; has_password?: boolean }) => {
					if (result.email_exists) {
						return this._authDialogService
							.openAuthDialog({
								hideRegisterTab: true,
								email: userEmail,
								canSignInWithAPassword: !!result.has_password,
								redirectUrl: this._router.url,
								closeDialogWhenConnected: true,
							})
							.afterClosed();
					} else {
						return this._authService.createOpenAccountWithEmail$(userEmail, false, true).pipe(
							map((registrationResult) => {
								return !!registrationResult.access_token;
							})
						);
					}
				})
			)
			.subscribe();
	}
}
