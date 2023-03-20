import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { fromEvent, Observable, throwError } from 'rxjs';
import { mapTo, retryWhen, switchMap } from 'rxjs/operators';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
	private onlineChanges$ = fromEvent(window, 'online').pipe(mapTo(true));

	get isOnline() {
		return navigator.onLine;
	}
	constructor() {
		// console.log('%c[OfflineInterceptor.constructor]', 'color:green');
	}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		return next.handle(request).pipe(
			retryWhen((errors) => {
				if (this.isOnline) {
					return errors.pipe(switchMap((err) => throwError(err)));
				}
				return this.onlineChanges$;
			})
		);
	}
}
