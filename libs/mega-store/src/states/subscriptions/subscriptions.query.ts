import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { Subscription } from './subscription.model';
import { SubscriptionsState, SubscriptionsStore } from './subscriptions.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionsQuery extends QueryEntity<SubscriptionsState> {
	subscriptions: Subscription[] = [];

	subscriptions$: Observable<Subscription[]> = this.selectAll({
		sortBy: 'timeCreation',
		sortByOrder: Order.DESC,
		filterBy: (entity) => {
			const stateIsDefault = ['deleted', 'archived'].indexOf(entity.state || 'default') == -1;
			// const isOwner = this.profileStore.getValue().id == entity.ownerId;
			// return stateIsDefault && isOwner;
			return stateIsDefault;
		},
	}).pipe(
		filter((subscriptions) => !isEqual(this.subscriptions, subscriptions)),
		tap((subscriptions) => {
			this.subscriptions = subscriptions;
		}),
		shareReplay()
	);
	subscriptions$$: BehaviorSubject<Subscription[]> = new BehaviorSubject<Subscription[]>([] as Subscription[]);
	subscriptionsToSync$: Observable<Subscription[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: SubscriptionsStore) {
		super(store);
		this.subscriptions$.subscribe(this.subscriptions$$);
	}
}
