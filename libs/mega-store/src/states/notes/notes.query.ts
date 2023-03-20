import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { NotesStore, NotesState } from './notes.store';
import { BehaviorSubject, Observable } from 'rxjs';
import { Note } from './note.model';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { isEqual } from 'lodash';

@Injectable({ providedIn: 'root' })
export class NotesQuery extends QueryEntity<NotesState> {
	notes: Note[] = [];

	notes$: Observable<Note[]> = this.selectAll({
		filterBy: (entity) => {
			const stateIsDefault = ['deleted'].indexOf(entity.state || 'default') == -1;
			return stateIsDefault;
		},
	}).pipe(
		filter((notes) => !isEqual(this.notes, notes)),
		tap((notes) => {
			this.notes = notes;
		}),
		shareReplay()
	);
	notes$$: BehaviorSubject<Note[]> = new BehaviorSubject<Note[]>([] as Note[]);
	notesToSync$: Observable<Note[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: NotesStore) {
		super(store);
		this.notes$.subscribe(this.notes$$);
	}
}
