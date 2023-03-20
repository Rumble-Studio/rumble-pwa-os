import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable, NgModule } from '@angular/core';
import { AuthTokenInterceptor } from '@rumble-pwa/auth-system';
import { CorsInterceptor, OfflineInterceptor, RetryInterceptor } from '@rumble-pwa/requests';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerInterceptor implements HttpInterceptor {
	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		// console.log('%cRequest endpoint:', 'color:lightgreen', request.url);

		return next.handle(request);
	}
}

@NgModule({
	providers: [
		...(environment.production
			? [
					// retry interceptor if prod
					{
						provide: HTTP_INTERCEPTORS,
						useClass: RetryInterceptor,
						multi: true,
					},
			  ]
			: [
					// logger interceptor if not prod
					{
						provide: HTTP_INTERCEPTORS,
						useClass: LoggerInterceptor,
						multi: true,
					},
			  ]),
		{
			provide: HTTP_INTERCEPTORS,
			useClass: OfflineInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthTokenInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: CorsInterceptor,
			multi: true,
		},
	],
})
export class CoreModule {}
