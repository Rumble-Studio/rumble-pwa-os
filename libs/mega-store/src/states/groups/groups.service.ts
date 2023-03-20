import { Injectable } from '@angular/core';
import { Group } from './group.model';
import { GroupsStore } from './groups.store';

@Injectable({ providedIn: 'root' })
export class GroupsService {
	constructor(private groupsStore: GroupsStore) {}

	add(group: Group) {
		this.groupsStore.add(group);
	}

	update(id: string, group: Partial<Group>) {
		this.groupsStore.update(id, group);
	}
	upsert(group: Group) {
		this.groupsStore.upsert(group.id, group);
	}

	remove(id: string) {
		this.groupsStore.remove(id);
	}
	set(groups: Group[]) {
		this.groupsStore.set(groups);
	}

	removeAll() {
		this.groupsStore.remove();
	}

	upsertMany(groups: Group[]) {
		this.groupsStore.upsertMany(groups);
	}
}
