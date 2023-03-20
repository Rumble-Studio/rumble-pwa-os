import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Subscription } from './subscription.model';

export type SubscriptionsState = EntityState<Subscription>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'subscriptions', resettable: true })
@ToSync<Subscription>()
export class SubscriptionsStore extends EntityStore<SubscriptionsState> {
	constructor() {
		super();
	}
}
