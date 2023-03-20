import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class ConnectionStateService {
	private onlineEvent: Observable<Event>;
	private offlineEvent: Observable<Event>;
	public connectedSubject$$: BehaviorSubject<boolean> = new BehaviorSubject(navigator.onLine);
	public connected$: Observable<boolean>;

	constructor() {
		// console.log('%c[ConnectionStateService](constructor) connected:' + this.connected(), 'color:green');

		this.onlineEvent = fromEvent(window, 'online').pipe(untilDestroyed(this));
		this.offlineEvent = fromEvent(window, 'offline').pipe(untilDestroyed(this));

		this.onlineEvent.subscribe(() => {
			this.connectedSubject$$.next(true);
			// this.notificationsService.success('You are back online.');
		});
		this.offlineEvent.subscribe(() => {
			this.connectedSubject$$.next(false);
			// this.notificationsService.info('You are offline.');
		});
		this.connected$ = this.connectedSubject$$.asObservable();
	}

	public connected(): boolean {
		return navigator.onLine;
		// return this.connectedSubject.getValue();
	}
}
