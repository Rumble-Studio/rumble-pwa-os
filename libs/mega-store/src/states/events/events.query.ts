import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { EventsStore, EventsState } from './events.store';

@Injectable({ providedIn: 'root' })
export class EventsQuery extends QueryEntity<EventsState> {
	constructor(protected store: EventsStore) {
		super(store);
	}
}
