import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { concatMap, delay, retryWhen } from 'rxjs/operators';

export const retryCount = 2;
export const retryWaitMilliSeconds = 1000;

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
	get isOnline() {
		return navigator.onLine;
	}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		return next.handle(request).pipe(
			retryWhen((error) =>
				error.pipe(
					// retryBackoff({ initialInterval: 500, maxRetries: 12 }),
					concatMap((error, count) => {
						if (count <= retryCount && error.status == 500) {
							console.log('%c[RetryInterceptor.intercept]', 'color:green', 'retrying...', count, error.status);

							// Internal Server Error
							return of(error);
						}
						if (count <= retryCount && error.status == 503) {
							console.log('%c[RetryInterceptor.intercept]', 'color:green', 'retrying...', count, error.status);
							// Service Unavailable
							return of(error);
						}
						if (count <= retryCount && error.status == 504) {
							console.log('%c[RetryInterceptor.intercept]', 'color:green', 'retrying...', count, error.status);
							// Gateway Timeout
							return of(error);
						}
						console.log('Request error (' + (count + 1) + '/' + retryCount + '):', 'url:' + request.url, { error });

						return throwError(error);
					}),
					delay(retryWaitMilliSeconds)
				)
			)
		);
	}
}
