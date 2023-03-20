import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Script } from './script.model';

export type ScriptsState = EntityState<Script>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'scripts', resettable: true })
@ToSync<Script>()
export class ScriptsStore extends EntityStore<ScriptsState> {
	constructor() {
		super();
	}
}
