import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { FormsStore, FormsState } from './forms.store';
import { BehaviorSubject, Observable } from 'rxjs';
import { Form } from './form.model';
import { debounceTime } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FormsQuery extends QueryEntity<FormsState> {
	forms$: Observable<Form[]> = this.selectAll({
		filterBy: (entity) => ['deleted'].indexOf(entity.state || 'default') == -1,
	});
	forms$$: BehaviorSubject<Form[]> = new BehaviorSubject<Form[]>([] as Form[]);
	formsToSync$: Observable<Form[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: FormsStore) {
		super(store);
		this.forms$.subscribe(this.forms$$);
	}
}
