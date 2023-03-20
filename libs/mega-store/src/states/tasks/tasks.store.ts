import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Task } from './task.model';

export type TasksState = EntityState<Task>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'tasks', resettable: true })
@ToSync<Task>()
export class TasksStore extends EntityStore<TasksState> {
	constructor() {
		super();
	}
}
