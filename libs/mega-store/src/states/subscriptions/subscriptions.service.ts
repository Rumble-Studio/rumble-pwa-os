import { Injectable } from '@angular/core';
import { Subscription } from './subscription.model';
import { SubscriptionsStore } from './subscriptions.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
	constructor(private subscriptionsStore: SubscriptionsStore) {}

	add(subscription: Subscription) {
		this.subscriptionsStore.add(subscription);
	}

	update(id: string, subscription: Partial<Subscription>) {
		this.subscriptionsStore.update(id, subscription);
	}
	upsert(subscription: Subscription) {
		this.subscriptionsStore.upsert(subscription.id, subscription);
	}

	remove(id: string) {
		this.subscriptionsStore.remove(id);
	}
	upsertMany(subscriptions: Subscription[]) {
		this.subscriptionsStore.upsertMany(subscriptions);
	}
	set(subscriptions: Subscription[]) {
		this.subscriptionsStore.set(subscriptions);
	}
	removeAll() {
		this.subscriptionsStore.remove();
	}
}
