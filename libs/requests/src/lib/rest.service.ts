import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { filter, map, skip, switchMap, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Bss$$, ConnectionStateService } from '@rumble-pwa/utils';
import { NotificationsService } from '@rumble-pwa/client-notifications';

@Injectable({
	providedIn: 'root',
})
export class RestService {
	apiRoot$$ = new Bss$$<string | null>(null);

	get apiRoot() {
		return this.apiRoot$$.value;
	}

	constructor(
		public httpClient: HttpClient,
		private connectionStateService: ConnectionStateService,
		private notificationsService: NotificationsService
	) {
		this.connectionStateService.connected$.pipe(skip(1)).subscribe((connected) => {
			if (connected) {
				this.notificationsService.success('You are back online.');
			} else {
				this.notificationsService.info('You are offline.');
			}
		});
	}

	get<T>(endpoint: string, params?: HttpParamsOptions['fromObject']): Observable<T> {
		const queryParamStr = new HttpParams({ fromObject: params });

		return this.apiRoot$$.$$.pipe(
			filter((apiRoot) => !!apiRoot),
			take(1),
			switchMap((apiRoot) =>
				this.httpClient.get(apiRoot + endpoint, { params: queryParamStr }).pipe(map((result) => result as T))
			)
		);
	}

	postFormData<T>(endpoint: string, data: { [name: string]: string | Blob }): Observable<T> {
		const formData = new FormData();
		for (const name in data) {
			formData.append(name, data[name]);
		}
		return this.apiRoot$$.$$.pipe(
			filter((apiRoot) => !!apiRoot),
			take(1),
			switchMap((apiRoot) => this.httpClient.post<T>(apiRoot + endpoint, formData))
		);
	}

	postFormDataWithProgress<T>(endpoint: string, data: { [name: string]: string | Blob }): Observable<HttpEvent<T>> {
		const formData = new FormData();
		for (const name in data) {
			formData.append(name, data[name]);
		}
		return this.apiRoot$$.$$.pipe(
			filter((apiRoot) => !!apiRoot),
			take(1),
			switchMap((apiRoot) =>
				this.httpClient.post<T>(apiRoot + endpoint, formData, {
					reportProgress: true,
					observe: 'events',
				})
			)
		);
	}

	post<T>(endpoint: string, data: unknown): Observable<T> {
		return this.apiRoot$$.$$.pipe(
			filter((apiRoot) => !!apiRoot),
			take(1),
			switchMap((apiRoot) => this.httpClient.post<T>(apiRoot + endpoint, data))
		);
	}

	postForBlob(endpoint: string, data: unknown): Observable<Blob> {
		return this.apiRoot$$.$$.pipe(
			filter((apiRoot) => !!apiRoot),
			take(1),
			switchMap((apiRoot) =>
				this.httpClient.post(apiRoot + endpoint, data, {
					headers: {
						'ngsw-bypass': 'custom-header',
					},
					responseType: 'blob',
				})
			)
		);
	}

	put<T>(endpoint: string, data: unknown): Observable<T> {
		return this.apiRoot$$.$$.pipe(
			filter((apiRoot) => !!apiRoot),
			take(1),
			switchMap((apiRoot) => this.httpClient.put<T>(apiRoot + endpoint, data))
		);
	}

	delete<T>(endpoint: string): Observable<T> {
		return this.apiRoot$$.$$.pipe(
			filter((apiRoot) => !!apiRoot),
			take(1),
			switchMap((apiRoot) => this.httpClient.delete<T>(apiRoot + endpoint))
		);
	}

	setApiRoot(apiRoot: string) {
		// console.log('Setting apiRout', apiRoot);
		this.apiRoot$$.value = apiRoot;
	}
}
