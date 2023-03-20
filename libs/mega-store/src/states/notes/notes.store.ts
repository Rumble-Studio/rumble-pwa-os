import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Note } from './note.model';

export type NotesState = EntityState<Note>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'notes', resettable: true })
@ToSync<Note>()
export class NotesStore extends EntityStore<NotesState> {
	constructor() {
		super();
	}
}
