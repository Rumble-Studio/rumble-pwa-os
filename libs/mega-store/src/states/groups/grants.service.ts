import { Injectable } from '@angular/core';
import { Grant } from './grant.model';
import { GrantsStore } from './grants.store';

@Injectable({ providedIn: 'root' })
export class GrantsService {
	constructor(private grantsStore: GrantsStore) {}

	add(grant: Grant) {
		this.grantsStore.add(grant);
	}

	update(id: string, grant: Partial<Grant>) {
		this.grantsStore.update(id, grant);
	}
	upsert(grant: Grant) {
		this.grantsStore.upsert(grant.id, grant);
	}

	remove(id: string) {
		this.grantsStore.remove(id);
	}
	set(grants: Grant[]) {
		this.grantsStore.set(grants);
	}
	removeAll() {
		this.grantsStore.remove();
	}

	upsertMany(grants: Grant[]) {
		this.grantsStore.upsertMany(grants);
	}
}
