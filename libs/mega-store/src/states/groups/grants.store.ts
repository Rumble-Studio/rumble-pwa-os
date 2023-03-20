import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Grant } from './grant.model';

export interface GrantsState extends EntityState<Grant> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'grants', resettable: true })
@ToSync<Grant>()
export class GrantsStore extends EntityStore<GrantsState> {
	constructor() {
		super();
	}
}
