import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Notification } from './notification.model';

export type NotificationsState = EntityState<Notification>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'notifications', resettable: true })
@ToSync<Notification>()
export class NotificationsStore extends EntityStore<NotificationsState> {
	constructor() {
		super();
	}
}
