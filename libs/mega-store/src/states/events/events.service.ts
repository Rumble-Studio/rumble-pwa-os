import { Injectable } from '@angular/core';
import { Event } from './event.model';
import { EventsStore } from './events.store';

@Injectable({ providedIn: 'root' })
export class EventsService {
	constructor(private eventsStore: EventsStore) {}

	add(event: Event) {
		this.eventsStore.add(event);
	}

	update(id: string, event: Partial<Event>) {
		this.eventsStore.update(id, event);
	}

	upsert(event: Event) {
		this.eventsStore.upsert(event.id, event);
	}

	remove(id: string) {
		this.eventsStore.remove(id);
	}

	removeAll() {
		this.eventsStore.remove();
	}

	upsertMany(events: Event[]) {
		this.eventsStore.upsertMany(events);
	}
}
