import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Event } from './event.model';

export interface EventsState extends EntityState<Event> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'events', resettable: true })
export class EventsStore extends EntityStore<EventsState> {
	constructor() {
		super();
	}
}
