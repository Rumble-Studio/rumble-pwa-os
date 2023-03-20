import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Operation } from './operation.model';

export type OperationsState = EntityState<Operation>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'operations', resettable: true })
@ToSync<Operation>()
export class OperationsStore extends EntityStore<OperationsState> {
	constructor() {
		super();
	}
}
