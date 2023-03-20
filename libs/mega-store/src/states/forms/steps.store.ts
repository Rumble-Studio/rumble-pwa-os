import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Step } from './step.model';

export type StepsState = EntityState<Step>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'steps', resettable: true })
@ToSync<Step>()
export class StepsStore extends EntityStore<StepsState> {
	constructor() {
		super();
	}
}
