import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { HttpEventType, HttpHeaders } from '@angular/common/http';
import { InterceptorSkipHeader } from '@rumble-pwa/auth-system';
import { RestService } from '@rumble-pwa/requests';
import { retryBackoff } from '@rumble-pwa/utils';
import { throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class GcpUploadService {
	debug = false;

	constructor(private _restService: RestService) {}

	getResumableUploadUrl$(entityFileId: string, contentType: string): Observable<string> {
		return this._restService.post<string>('/files/' + entityFileId + '/resumable-url', contentType).pipe(
			// tap((url: string) => {
			// 	console.log('(getResumableUploadUrl$) Got resumable upload url:', url);
			// }),
			retryBackoff({ initialInterval: 100, maxRetries: 12 }),
			catchError((error) => {
				let errorMessage = '';
				if (error.error instanceof ErrorEvent) {
					// client-side error
					errorMessage = `Error: ${error.error.message}`;
				} else {
					// server-side error
					errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
				}
				// console.warn('(getResumableUploadUrl$)', errorMessage);
				return throwError(errorMessage);
			})
			// tap((url) => console.log('(getResumableUploadUrl$)no error', url))
		);
	}

	/**
	 * Upload an entityFile to the GCP server (generating a new put URL).
	 * @param entityFileId
	 * @param upload_file
	 * @param progressCallback
	 * @returns
	 */
	uploadToGCPServerResumable$(entityFileId: string, upload_file: File, progressCallback: (progress: number) => void) {
		return this.getResumableUploadUrl$(entityFileId, upload_file.type).pipe(
			switchMap((url: string) => {
				const formData = new FormData();
				formData.append('upload_file', upload_file);
				const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
				return this._restService.httpClient.put(url, upload_file, {
					reportProgress: true,
					observe: 'events',
					headers,
				});
			}),
			tap((event) => {
				if (event.type === HttpEventType.UploadProgress) {
					progressCallback(event.loaded / (event.total || 1));
				} else if (event.type === HttpEventType.Response) {
					// console.log('Upload is over:', event.body);
				} else {
					// console.log('Upload event:', event);
				}
			})
		);
	}

	/**
	 * Upload a file directly to the GCP server using an existing put URL.
	 * @param url
	 * @param upload_file
	 * @param progressCallback
	 * @returns
	 */
	uploadFileToUrl$(url: string, upload_file: File, progressCallback?: (progress: number) => void) {
		const formData = new FormData();
		formData.append('upload_file', upload_file);
		const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
		return this._restService.httpClient
			.put(url, upload_file, {
				reportProgress: true,
				observe: 'events',
				headers,
			})
			.pipe(
				catchError((error) => {
					let errorMessage = '';
					if (error.error instanceof ErrorEvent) {
						// client-side error
						errorMessage = `Error: ${error.error.message}`;
					} else {
						// server-side error
						errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
					}
					console.warn('(uploadFileToUrl$)', errorMessage, 'This will be retried 3 times.');
					return throwError(errorMessage);
				}),
				// retry(3),
				retryBackoff({ initialInterval: 100, maxRetries: 12 }),
				tap((event) => {
					if (event.type === HttpEventType.UploadProgress) {
						console.log('Upload is in progress:', event.loaded, event.total);
						if (progressCallback) progressCallback(event.loaded / (event.total || 1));
					} else if (event.type === HttpEventType.Response) {
						console.log('Upload is over:', event.body);
					} else {
						console.log('Upload event:', event);
					}
				})
			);
	}
}
