import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Mix } from './mix.model';

export type MixesState = EntityState<Mix>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'mixes', resettable: true })
@ToSync<Mix>()
export class MixesStore extends EntityStore<MixesState> {
	constructor() {
		super();
	}
}
