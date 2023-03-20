import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ScriptsStore, ScriptsState } from './scripts.store';
import { BehaviorSubject, Observable } from 'rxjs';
import { Script } from './script.model';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { isEqual } from 'lodash';

@Injectable({ providedIn: 'root' })
export class ScriptsQuery extends QueryEntity<ScriptsState> {
	scripts: Script[] = [];

	scripts$: Observable<Script[]> = this.selectAll({
		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
	}).pipe(
		filter((scripts) => !isEqual(this.scripts, scripts)),
		tap((scripts) => {
			this.scripts = scripts;
		}),
		shareReplay()
	);
	scripts$$: BehaviorSubject<Script[]> = new BehaviorSubject<Script[]>([] as Script[]);
	scriptsToSync$: Observable<Script[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: ScriptsStore) {
		super(store);
		this.scripts$.subscribe(this.scripts$$);
	}
}
