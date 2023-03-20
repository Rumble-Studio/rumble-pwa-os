import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { StepsStore, StepsState } from './steps.store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Step } from './step.model';
import { debounceTime, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { isEqual } from 'lodash';
import { FormsQuery } from './forms.query';
@Injectable({ providedIn: 'root' })
export class StepsQuery extends QueryEntity<StepsState> {
	steps: Step[] = [];

	steps$: Observable<Step[]> = this.selectAll({
		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
	}).pipe(
		filter((steps) => !isEqual(this.steps, steps)),
		tap((steps) => {
			this.steps = steps;
		}),
		shareReplay()
	);
	steps$$: BehaviorSubject<Step[]> = new BehaviorSubject<Step[]>([] as Step[]);

	stepsToSync$: Observable<Step[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(
		switchMap((steps) => {
			// to ensure to only sync steps if forms are on the server
			const stepsWithEntriesInDb$ = steps.map((step) => {
				const formSynced$ = this.formsQuery.selectEntity(step.formId).pipe(
					map((form) => {
						if (form && form.toSync == false) return true;
						return false;
					}),
					startWith(false)
				);

				// return combineLatest([playlistSynced$, formSynced$]).pipe(
				//   map(([playlistSynced, formSynced]) => {
				//     return { step, childrenSynced: playlistSynced && formSynced };
				//   })
				// );

				return formSynced$.pipe(
					map((formSynced) => {
						return { step, childrenSynced: formSynced };
					})
				);
			});

			return combineLatest(stepsWithEntriesInDb$);
		}),
		map(
			(stepsWithEntriesInDb) => stepsWithEntriesInDb.filter((tf) => tf.childrenSynced).map((tf) => tf.step),
			debounceTime(500)
		)
	);

	constructor(protected store: StepsStore, private formsQuery: FormsQuery) {
		super(store);
		this.steps$.subscribe(this.steps$$);
	}
}
