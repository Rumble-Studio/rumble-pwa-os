import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Group } from './group.model';

export type GroupsState = EntityState<Group>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'groups', resettable: true })
@ToSync<Group>()
export class GroupsStore extends EntityStore<GroupsState> {
	constructor() {
		super();
	}
}
