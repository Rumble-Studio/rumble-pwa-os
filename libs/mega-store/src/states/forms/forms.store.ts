import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Form } from './form.model';

export type FormsState = EntityState<Form>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'forms', resettable: true })
@ToSync<Form>()
export class FormsStore extends EntityStore<FormsState> {
	constructor() {
		super();
	}
}
