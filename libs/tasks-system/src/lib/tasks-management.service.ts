import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Task, TasksQuery, TasksService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { sortBy } from 'lodash';
import { BehaviorSubject, of } from 'rxjs';
import { debounceTime, switchMap, take, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class TasksManagementService {
	tasks$$: BehaviorSubject<Task[]>;

	constructor(
		private restService: RestService,
		private tasksService: TasksService,
		private tasksQuery: TasksQuery,
		private _usersRepository: UsersRepository
	) {
		this.tasks$$ = this.tasksQuery.tasks$$;

		// selectPersistStateInit()
		// 	.pipe(take(1))
		// .subscribe(() => {
		// this.pullData();
		// 	this.pushData();
		// });

		// console.warn('TASKS ARE NOT LOADED');
	}

	// pullData() {
	// 	// get tasks data from server (if isloggedIn)
	// 	this._usersRepository.isConnected$$
	// 		.pipe(
	// 			switchMap((isLoggedIn) => {
	// 				if (isLoggedIn) {
	// 					return this.restService.get<Task[]>('/tasks');
	// 				}
	// 				return of([] as Task[]);
	// 			}),
	// 			tap((taskApis) => {
	// 				console.log({ taskApis: sortBy(taskApis, 'timeCreation') });

	// 				// upsert tasks to local store
	// 				this.tasksService.upsertMany(
	// 					taskApis.map((taskApis) => {
	// 						return { ...taskApis, operation: 'refresh' };
	// 					})
	// 				);
	// 			})
	// 		)
	// 		.subscribe();
	// }

	// pullDataOnce() {
	// 	// get tasks data from server (if isloggedIn)
	// 	this._usersRepository.isConnected$$
	// 		.pipe(
	// 			take(1), // only once
	// 			switchMap((isLoggedIn) => {
	// 				if (isLoggedIn) {
	// 					return this.restService.get<Task[]>('/tasks');
	// 				}
	// 				return of([] as Task[]);
	// 			}),
	// 			tap((taskApis) => {
	// 				console.log({ taskApis: sortBy(taskApis, 'timeCreation') });

	// 				// upsert tasks to local store
	// 				this.tasksService.upsertMany(
	// 					taskApis.map((taskApis) => {
	// 						return { ...taskApis, operation: 'refresh' };
	// 					})
	// 				);
	// 			})
	// 		)
	// 		.subscribe();
	// }

	pullTaskByIdOnce(id: string) {
		this._usersRepository.isConnected$$
			.pipe(
				take(1),
				switchMap((isLoggedIn) => {
					if (isLoggedIn) {
						return this.restService.get<Task>('/tasks/' + id);
					}
					return of(undefined);
				}),
				tap((taskApi) => {
					console.log('taskApi is:', taskApi);

					// upsert task to local store
					if (taskApi) {
						this.tasksService.upsert({ ...taskApi, operation: 'refresh' });
					}
				})
			)
			.subscribe();
	}

	// pushData() {
	// 	this.tasksQuery.taskssToSync$.pipe(debounceTime(1000)).subscribe((tasks) => {
	// 		tasks.forEach((task) => {
	// 			if (task?.operation === 'creation') {
	// 				this._postToServer(task);
	// 			} else if (task?.operation === 'update') {
	// 				this._putToServer(task);
	// 			}
	// 		});
	// 	});
	// }

	//
	// SERVER SYNC
	//
	// private _putToServer(task: Task) {
	// 	return this.restService
	// 		.put<Task>('/tasks/' + task.id, task)
	// 		.pipe(
	// 			tap((r) => {
	// 				this.tasksService.upsert({ ...r, operation: 'refresh' });
	// 			})
	// 		)
	// 		.subscribe();
	// }
	// private _postToServer(task: Task) {
	// 	const updatedTask: Task = task;
	// 	return this.restService
	// 		.post<Task>('/tasks', updatedTask)
	// 		.pipe(
	// 			tap((r) => {
	// 				// console.log('post result is:', r);
	// 				this.tasksService.upsert({ ...r, operation: 'refresh' });
	// 			})
	// 		)
	// 		.subscribe();
	// }

	// public update(id: string, data: Partial<Task>) {
	// 	this.tasksService.update(id, data);
	// }

	// public removeFromStore(id: string) {
	// 	this.tasksService.remove(id);
	// }

	public get(id: string) {
		return this.tasksQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.tasksQuery.selectEntity(id);
	}
}
