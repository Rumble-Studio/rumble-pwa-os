import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { AuthTokensRepository } from '../authTokens.repository';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';

@Injectable({ providedIn: 'root' })
export class AuthTokenInterceptor implements HttpInterceptor {
	constructor(
		//
		private _authTokensRepository: AuthTokensRepository,
		private _authService: AuthService // _notificationsService: NotificationsService
	) {}

	addAuthHeader(request: HttpRequest<unknown>) {
		if (request.headers.has(InterceptorSkipHeader)) {
			// Avoid adding the header if Interceptor Header is present
			// This is particularly useful for 3rd parties links
			// like Google Storage links that must respect certains rules
			const headers = request.headers.delete(InterceptorSkipHeader);
			return request.clone({ headers });
		}

		const currentToken = this._authTokensRepository.getCurrentAuthToken();
		if (currentToken) {
			const authRequest = request.clone({
				headers: request.headers.set('Authorization', 'Bearer ' + currentToken),
			});
			return authRequest;
		}
		return request;
	}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		request = this.addAuthHeader(request);
		/** Public pages are not CNAMED pages, ex: collection public page for rss feed validators */
		const publicPage = window.location.href.includes('/public');

		return next.handle(request).pipe(
			catchError((error) => {
				if (error.status === 401 && !publicPage) {
					this._authService.logout(
						true,
						false,
						{
							type: 'warning',
							body: 'You have been disconnected after a long period without entering your password.',
							title: 'Security',
						}
						// 	);
						// this._notificationsService.warning('You have been disconnected after a long period without entering your password.',
						// 	'Security')
					);
					// 	return of(error);
				}
				return throwError(error);
				// return this.handleResponseError(error, request, next);
			})
		);
	}
}
