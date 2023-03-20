import { Injectable } from '@angular/core';
import { Notification } from './notification.model';
import { NotificationsStore } from './notifications.store';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
	constructor(private notificationsStore: NotificationsStore) {}

	add(notification: Notification) {
		this.notificationsStore.add(notification);
	}

	update(id: string, notification: Partial<Notification>) {
		this.notificationsStore.update(id, notification);
	}
	upsert(notification: Notification) {
		this.notificationsStore.upsert(notification.id, notification);
	}
	set(notifications: Notification[]) {
		this.notificationsStore.set(notifications);
	}

	remove(id: string) {
		this.notificationsStore.remove(id);
	}
	upsertMany(notifications: Notification[]) {
		this.notificationsStore.upsertMany(notifications);
	}
	removeAll() {
		this.notificationsStore.remove();
	}
}
