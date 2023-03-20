import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { Notification } from './notification.model';
import { NotificationsState, NotificationsStore } from './notifications.store';

@Injectable({ providedIn: 'root' })
export class NotificationsQuery extends QueryEntity<NotificationsState> {
	notifications: Notification[] = [];

	notifications$: Observable<Notification[]> = this.selectAll({
		filterBy: (entity) => {
			const stateIsDefault = ['deleted'].indexOf(entity.state || 'default') == -1;
			return stateIsDefault;
		},
	}).pipe(
		filter((notifications) => !isEqual(this.notifications, notifications)),
		tap((notifications) => {
			this.notifications = notifications;
		}),
		shareReplay()
	);
	notifications$$: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([] as Notification[]);
	notificationsToSync$: Observable<Notification[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: NotificationsStore) {
		super(store);
		this.notifications$.subscribe(this.notifications$$);
	}
}
