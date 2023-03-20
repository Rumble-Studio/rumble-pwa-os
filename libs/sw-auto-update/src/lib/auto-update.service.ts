import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';
import { NotificationsService } from '@rumble-pwa/client-notifications';

@Injectable({
	providedIn: 'root',
})
export class AutoUpdateService {
	constructor(private swUpdate: SwUpdate, private notificationsService: NotificationsService) {}

	public subcribeToSWUpdates() {
		this.swUpdate.available.subscribe((event) => {
			console.log('new version available', event.current.hash + '->' + event.available.hash);
			this.swUpdate.activateUpdate();
		});
		this.swUpdate.activated.subscribe((event) => {
			const timeToWaitForRefresh = 5 * 1000;
			console.log('new version installed', event.previous ? event.previous.hash : '()' + '->' + event.current.hash);

			setTimeout(() => {
				document.location.reload();
			}, timeToWaitForRefresh);

			this.notificationsService.success(
				'New version installed! The app will reload itself in 5 seconds.',
				'New version'
				// {
				//   progressBar: true,
				//   timeOut: 1.05 * timeToWaitForRefresh,
				// }
			);
			// .onTap.pipe(take(1))
			// .subscribe(() => {
			//   document.location.reload();
			// });
		});

		// check for SW updates
		const everySixHours$ = interval(5 * 60 * 1000);
		everySixHours$.subscribe(() => {
			// console.log('[AutoUpdateService] checking SW update...');
			this.swUpdate.checkForUpdate();
		});
	}
}
