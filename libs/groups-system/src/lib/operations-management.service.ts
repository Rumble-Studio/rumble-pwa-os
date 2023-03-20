import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Operation, OperationsQuery, OperationsService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, take, tap } from 'rxjs/operators';
@Injectable({
	providedIn: 'root',
})
export class OperationsManagementService {
	operations$$: BehaviorSubject<Operation[]>;

	constructor(
		private restService: RestService,
		private operationsService: OperationsService,
		private operationsQuery: OperationsQuery,
		private _usersRepository: UsersRepository
	) {
		this.operations$$ = this.operationsQuery.operations$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get operations data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Operation[]>('/operations').subscribe((operationApis) => {
					// upsert operations to local store
					this.operationsService.upsertMany(
						operationApis.map((operationApis) => {
							return { ...operationApis, operation: 'refresh' };
						})
					);
				});
		});
	}

	pushData() {
		this.operationsQuery.operationsToSync$.pipe(debounceTime(1000)).subscribe((operations) => {
			operations.forEach((operation) => {
				if (operation?.operation === 'creation') {
					this._postToServer(operation);
				} else if (operation?.operation === 'update') this._putToServer(operation);
			});
		});
	}

	public add(data: Operation) {
		this.operationsService.add(data);
	}
	public update(id: string, data: Partial<Operation>) {
		this.operationsService.update(id, data);
	}
	public removeFromStore(id: string) {
		this.operationsService.remove(id);
	}
	public delete(id: string) {
		this.operationsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.operationsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.operationsService.update(id, { state: 'default' });
	}

	public getAll$() {
		return this.operationsQuery.selectAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getAll() {
		return this.operationsQuery.getAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public get(id: string) {
		return this.operationsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.operationsQuery.selectEntity(id);
	}

	//
	// SERVER SYNC
	//
	private _putToServer(operation: Operation) {
		return this.restService
			.put<Operation>('/operations/' + operation.id, operation)
			.pipe(
				tap((r) => {
					this.operationsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(operation: Operation) {
		return this.restService
			.post<Operation>('/operations', operation)
			.pipe(
				tap((r) => {
					this.operationsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
}
