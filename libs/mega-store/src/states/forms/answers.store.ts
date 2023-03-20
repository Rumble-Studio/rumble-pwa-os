import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Answer } from './answer.model';

export type AnswersState = EntityState<Answer>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'answers', resettable: true })
@ToSync<Answer>()
export class AnswersStore extends EntityStore<AnswersState> {
	constructor() {
		super();
	}
}
