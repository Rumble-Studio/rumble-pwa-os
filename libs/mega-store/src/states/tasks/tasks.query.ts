import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Task } from './task.model';
import { TasksStore, TasksState } from './tasks.store';

@Injectable({ providedIn: 'root' })
export class TasksQuery extends QueryEntity<TasksState> {
	tasks$: Observable<Task[]> = this.selectAll();
	tasks$$: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>([]);
	taskssToSync$: Observable<Task[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: TasksStore) {
		super(store);
		this.tasks$.subscribe(this.tasks$$);
	}
}
