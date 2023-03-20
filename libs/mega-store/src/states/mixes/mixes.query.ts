import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { MixesStore, MixesState } from './mixes.store';
import { BehaviorSubject, Observable } from 'rxjs';
import { Mix } from './mix.model';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { isEqual } from 'lodash';

@Injectable({ providedIn: 'root' })
export class MixesQuery extends QueryEntity<MixesState> {
	mixes: Mix[] = [];

	mixes$: Observable<Mix[]> = this.selectAll({
		filterBy: (entity) => {
			const stateIsDefault = ['deleted'].indexOf(entity.state || 'default') == -1;
			return stateIsDefault;
		},
	}).pipe(
		filter((mixes) => !isEqual(this.mixes, mixes)),
		tap((mixes) => {
			this.mixes = mixes;
		}),
		shareReplay()
	);
	mixes$$: BehaviorSubject<Mix[]> = new BehaviorSubject<Mix[]>([] as Mix[]);
	mixesToSync$: Observable<Mix[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: MixesStore) {
		super(store);
		this.mixes$.subscribe(this.mixes$$);
	}
}
