import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { Grant } from './grant.model';
import { GrantsStore, GrantsState } from './grants.store';

@Injectable({ providedIn: 'root' })
export class GrantsQuery extends QueryEntity<GrantsState> {
	grants: Grant[] = [];

	grants$: Observable<Grant[]> = this.selectAll({
		filterBy: (entity) => {
			const stateIsDefault = ['deleted', 'archived'].indexOf(entity.state || 'default') == -1;
			return stateIsDefault;
		},
	}).pipe(
		filter((grants) => !isEqual(this.grants, grants)),
		tap((grants) => {
			this.grants = grants;
		}),
		shareReplay()
	);
	grants$$: BehaviorSubject<Grant[]> = new BehaviorSubject<Grant[]>([] as Grant[]);
	grantsToSync$: Observable<Grant[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: GrantsStore) {
		super(store);
		this.grants$.subscribe(this.grants$$);
	}
}
