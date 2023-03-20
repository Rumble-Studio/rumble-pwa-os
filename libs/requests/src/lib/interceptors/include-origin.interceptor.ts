import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class IncludeOriginInterceptor implements HttpInterceptor {
	constructor() {
		console.log('%c[IncludeOriginInterceptor.constructor]', 'color:green');
		console.warn("THIS INTERCEPTOR CAN'T BE USED IN PRODUCTION");
		console.warn('THE ORIGIN HEADER SHOULD ONLY BE SET BY THE BROWSER.');
	}

	addHeader(request: HttpRequest<unknown>) {
		if (location.origin) {
			const originRequest = request.clone({
				headers: request.headers.set('origin', location.origin),
			});
			return originRequest;
		}
		return request;
	}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		request = this.addHeader(request);

		return next.handle(request);
	}
}
