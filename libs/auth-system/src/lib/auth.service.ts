import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { resetStores } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { RestService } from '@rumble-pwa/requests';
import { StorageService } from '@rumble-pwa/storage';
import { Attr, getRouteQueryParam$ } from '@rumble-pwa/utils';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { catchError, take, tap, throttleTime } from 'rxjs/operators';
import { AuthTokensRepository } from './authTokens.repository';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class AuthService {
	// this status will let us know if we should stay on password reset page
	// or leave it
	passwordResetStatus$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

	logout$ = new Subject<{
		redirectToLogin: boolean;
		refreshPage: boolean;
		notification?: { type: 'warning' | 'error' | 'success'; body: string; title?: string };
	}>();

	redirectUrlCache?: string;

	constructor(
		private _notificationsService: NotificationsService,
		private _restService: RestService,
		private _router: Router,
		private _storageService: StorageService, // we inject all the stores for login/logout clearing behaviour
		private _amplitudeService: AmplitudeService,
		private _activatedRoute: ActivatedRoute,
		private _authTokenRepository: AuthTokensRepository
	) {
		// console.log('%c[AuthService](constructor)', 'color:green');

		getRouteQueryParam$(this._activatedRoute, 'redirectUrl')
			.pipe(
				untilDestroyed(this),
				tap((redirectUrl) => {
					if (redirectUrl) {
						this.redirectUrlCache = this.redirectUrlCache ?? redirectUrl;
						// console.log('%c[AuthService](constructor)', 'color:green', 'redirectUrl', redirectUrl);
					}
				})
			)
			.subscribe();

		// selectPersistStateInit()
		// 	.pipe(take(1))
		// 	.subscribe(() => {
		// 		// SAVE SESSION DETAILS TO CACHE for multi tab mgmt
		// 		this.session$.subscribe((session) => {
		// 			// get the current history from local storage
		// 			const storedAuthHistory = window.localStorage.getItem(AUTH_STORAGE_KEY);
		// 			// parse the history as an array
		// 			const authHistory = storedAuthHistory ? JSON.parse(storedAuthHistory) : [];
		// 			// add the new action as first item to the history array
		// 			const newAuthHistory = [{ localClientId, session }, ...authHistory.slice(0, 4)];
		// 			// serialize the new array and update local storage
		// 			window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthHistory));
		// 		});

		// 		// subscribe to cache history to see if other tabs are logged in
		// 		fromEvent<StorageEvent>(window, 'storage')
		// 			.pipe(
		// 				untilDestroyed(this),
		// 				startWith({
		// 					key: AUTH_STORAGE_KEY,
		// 					oldValue: null,
		// 					newValue: '[]',
		// 				}),
		// 				filter((evt) => evt.key === AUTH_STORAGE_KEY),
		// 				tap((evt) => {
		// 					// only react if current tab is hidden
		// 					if (evt.newValue && document.hidden) {
		// 						const authHistory = JSON.parse(evt.newValue);
		// 						if (authHistory.length > 0) {
		// 							if (authHistory[0].session.token) {
		// 								if (authHistory[0].session.token !== this.sessionQuery.getValue().token) {
		// 									// console.log('Logging in');
		// 									this.sessionService.login(authHistory[0].session);
		// 								}
		// 							} else {
		// 								// console.log('Logging out');
		// 								this.logout(false);
		// 							}
		// 						}
		// 					}
		// 				})
		// 			)
		// 			.subscribe();
		// 	});

		this.logout$
			.pipe(
				untilDestroyed(this),
				throttleTime(500),
				tap(({ redirectToLogin, refreshPage, notification }) => {
					console.log('%cProcessing log out', 'color:red', redirectToLogin, refreshPage, notification);

					this._amplitudeService.saveEvent('auth:logout', {
						redirectToLogin,
						refreshPage,
					});

					this.clearStores();

					if (notification) {
						if (notification.type === 'warning') {
							this._notificationsService.warning(notification.body ?? '', notification.title);
						}
						if (notification.type === 'error') {
							this._notificationsService.error(notification.body ?? '', notification.title);
						}
						if (notification.type === 'success') {
							this._notificationsService.success(notification.body ?? '', notification.title);
						}
					}

					if (redirectToLogin ?? false) {
						console.log('[AuthService](logout$) Redirecting to login');
						this._router.navigate([`/auth/connexion`]);
					}

					if (refreshPage ?? false) {
						setTimeout(() => {
							location.reload();
						}, 100);
					}
				})
			)
			.subscribe();
	}

	public consumeRedirectCache(who: string, alternativeUrl?: string) {
		if (this.redirectUrlCache) {
			console.log('%c[AuthService](consumeRedirectCache)', 'color:green', 'redirectUrlCache', this.redirectUrlCache);
			const decodedUrl = decodeURIComponent(this.redirectUrlCache);
			this._router.navigateByUrl(decodedUrl);
			this.redirectUrlCache = undefined;
			return;
		}
		if (alternativeUrl) {
			console.log('%c[AuthService](consumeRedirectCache)', 'color:red', 'alternativeUrl', alternativeUrl);
			const decodedUrl = decodeURIComponent(alternativeUrl);
			this._router.navigateByUrl(decodedUrl);
			this.redirectUrlCache = undefined;
			return;
		}
		setTimeout(() => {
			this._router.navigateByUrl('/');
		}, 10);
		console.log('%c[AuthService](consumeRedirectCache)', 'color:green', 'no redirectUrlCache');
	}

	login(email: string, password: string) {
		this._amplitudeService.saveEvent('auth:login', {
			withToken: false,
		});
		return this._restService
			.postFormData<{ access_token: string | null; token_type: string | null }>('/login/access-token', {
				username: email,
				password,
			})
			.pipe(
				catchError((err) => {
					this._notificationsService.error(
						`Error while logging${err?.error?.detail ? ': ' + (err.error.detail[0].msg || err.error.detail) : '.'}`,
						'Error',
						err.error
					);
					return of({ access_token: null, token_type: null });
				}),
				tap((res) => {
					if (res.access_token) {
						this.loginWithToken(res.access_token);
					}
				})
			);
	}

	loginWithGoogleToken(googleToken: string) {
		return this._restService
			.post<{ access_token: string | null; token_type: string | null }>('/login/google-token', googleToken)
			.pipe(
				take(1),
				catchError((err) => {
					this._notificationsService.error(
						`Error while logging${err?.error?.detail ? ': ' + err.error.detail : '.'}`,
						'Error',
						err.error
					);
					return of({ access_token: null, token_type: null });
				}),

				tap((res) => {
					if (res.access_token) {
						this.loginWithToken(res.access_token);
					}
				})
			);
	}

	loginAsAnonymous() {
		return this._restService
			.postFormData<{ access_token: string | null; token_type: string | null }>('/login/access-token-anonymous', {})
			.pipe(
				catchError((err) => {
					this._notificationsService.error(
						`Error while requesting an anonymous session${err?.error?.detail ? ': ' + err.error.detail : '.'}`,
						'Error',
						err.error
					);
					return of({ access_token: null, token_type: null });
				}),

				tap((res) => {
					if (res.access_token) {
						this.loginWithToken(res.access_token);
					}
				})
			);
	}

	loginFromAnonymous(email: string, password: string) {
		return this._restService
			.postFormData<{ access_token: string | null; token_type: string | null }>('/login/from-anonymous', {
				username: email,
				password,
			})
			.pipe(
				catchError((err) => {
					this._notificationsService.error(
						`Error while logging${err?.error?.detail ? ': ' + err.error.detail : '.'}`,
						'Error',
						err.error
					);
					return of({ access_token: null, token_type: null });
				}),
				tap((res) => {
					if (res.access_token) {
						this.loginWithToken(res.access_token);
					}
				})
			);
	}

	/**
	 * To be called with a token delivered by the server (not a random token)
	 * @param token
	 */
	loginWithToken(token: string) {
		if (token) {
			this._amplitudeService.saveEvent('auth:login', {
				withToken: true,
			});

			this._authTokenRepository.setAuthTokenProps({ token });
		}
	}

	logout(
		redirectToLogin: boolean,
		refreshPage = false,
		notification?: { type: 'warning' | 'error' | 'success'; body: string; title?: string }
	) {
		this.logout$.next({ redirectToLogin, refreshPage, notification });
	}

	registerPro(userProData: Attr) {
		this._amplitudeService.saveEvent('auth:register', {
			...userProData,
			password: '******',
			fromForm: false,
		});
		return this._restService
			.post<{ access_token: string | null; token_type: string | null }>('/users/register-pro', userProData)
			.pipe(
				catchError((err) => {
					console.log({ a: err });
					this._notificationsService.error(
						'Error while creating your account.' + (err?.error?.detail ? ' ' + err.error.detail : ''),
						'Error',
						err
					);
					return of({ access_token: null, token_type: null });
				}),
				tap((res) => {
					if (res.access_token) {
						this.loginWithToken(res.access_token);
					}
				})
			);
	}

	resetPasswordRequest(userEmail: string, redirectAfter = true, redirectUrl?: string) {
		console.log('[AuthService.resetPasswordRequest]', userEmail);
		this._amplitudeService.saveEvent('auth:reset-password:request');
		this._restService
			.post('/reset-password/request', { userEmail, redirectUrl })
			.pipe(take(1))
			.subscribe(
				() => {
					this._notificationsService.success('Please check your mailbox', 'Email sent');
					if (redirectAfter) this._router.navigate([`/auth/connexion`]);
				},
				(error) => {
					console.log(error.error.detail);
					if (error.error.detail == 'No user') {
						this._notificationsService.error(
							'There is no user associated with the email ' + userEmail,
							'Error',
							error
						);
					} else {
						this._notificationsService.error('An unexpected error happened.', 'Error', error);
					}
					// Send false when request failed
					this.passwordResetStatus$$.next(false);
				}
			);
	}

	checkAccountWithEmail$(email: string) {
		return this._restService.get<{ email_exists: boolean }>(`/users/check-account-with-email/${email}`);
	}

	/**
	 * Send an email with direct link
	 * @param email
	 */
	connectViaEmail$(
		userEmail: string,
		options?: {
			//
			redirectUrl?: string;
			fromName?: string;
			replyToEmail?: string;
			replyToName?: string;
			bodyMessage?: string;
			action?: string;
			subject?: string;
			title?: string;
		}
	) {
		return this._restService
			.post('/login/via-email/request', {
				userEmail,
				...options,
				// redirectUrl,
				// fromName,
				// replyToEmail,
				// replyToName,
				// bodyMessage,
			})
			.pipe(
				catchError((err) => {
					this._notificationsService.error(
						`Error while logging via email${
							err?.error?.detail ? ': ' + (err.error.detail[0].msg || err.error.detail) : '.'
						}`,
						'Error',
						err.error
					);
					return of({ access_token: null, token_type: null });
				}),
				tap(() => {
					this._notificationsService.info(
						'Click on link sent at ' + userEmail + ' to connect.',
						'Connexion link sent',
						undefined,
						undefined,
						20000
					);
				})
			);
	}

	createOpenAccountWithEmail$(email: string, isGuestOnly = false, notifyAdminTeam: boolean = false) {
		this._amplitudeService.saveEvent('auth:register', {
			fromForm: true,
			isGuestOnly,
			email,
		});
		// this.register(email, '', false, true);
		return this.registerPro({ email, isGuestOnly, notifyAdminTeam });
	}

	clearStores() {
		this._authTokenRepository.setAuthTokenProps({
			token: null,
		});
		resetStores();
		this._storageService.clear();
		localStorage.clear();

		try {
			const req = indexedDB.deleteDatabase('RumbleStudio');
			req.onsuccess = function () {
				console.log('Deleted database successfully');
			};
			req.onerror = function () {
				console.log("Couldn't delete database");
			};
			req.onblocked = function () {
				console.log("Couldn't delete database due to the operation being blocked");
			};
		} catch {
			console.log('Error while deleting DB indexed.');
		}
	}
}
