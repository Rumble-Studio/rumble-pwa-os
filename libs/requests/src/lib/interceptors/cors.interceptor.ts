import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {
	constructor() {
		// console.log('%c[CorsInterceptor.constructor]', 'color:green');
	}
	addHeader(request: HttpRequest<unknown>) {
		if (location.origin) {
			const originRequest = request.clone({
				headers: request.headers.set('Access-Control-Allow-Origin', location.origin),
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
