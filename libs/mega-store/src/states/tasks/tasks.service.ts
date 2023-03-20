import { Injectable } from '@angular/core';

import { Task } from './task.model';
import { TasksStore } from './tasks.store';

@Injectable({ providedIn: 'root' })
export class TasksService {
	constructor(private tasksStore: TasksStore) {}

	add(task: Task) {
		this.tasksStore.add(task);
	}

	update(id: string, task: Partial<Task>) {
		this.tasksStore.update(id, task);
	}

	upsert(task: Task) {
		this.tasksStore.upsert(task.id, task);
	}

	upsertMany(task: Task[]) {
		this.tasksStore.upsertMany(task);
	}

	removeAll() {
		this.tasksStore.remove();
	}

	remove(id: string) {
		this.tasksStore.remove(id);
	}
}
