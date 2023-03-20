import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Operation } from './operation.model';
import { OperationsState, OperationsStore } from './operations.store';

@Injectable({ providedIn: 'root' })
export class OperationsQuery extends QueryEntity<OperationsState> {
	operations$: Observable<Operation[]> = this.selectAll({
		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
	});
	operations$$: BehaviorSubject<Operation[]> = new BehaviorSubject<Operation[]>([] as Operation[]);
	operationsToSync$: Observable<Operation[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: OperationsStore) {
		super(store);
		this.operations$.subscribe(this.operations$$);
	}
}
