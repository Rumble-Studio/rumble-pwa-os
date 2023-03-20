import { Injectable } from '@angular/core';
import { Note } from './note.model';
import { NotesStore } from './notes.store';

@Injectable({ providedIn: 'root' })
export class NotesService {
	constructor(private notesStore: NotesStore) {}

	add(note: Note) {
		this.notesStore.add(note);
	}

	update(id: string, note: Partial<Note>) {
		this.notesStore.update(id, note);
	}
	upsert(note: Note) {
		this.notesStore.upsert(note.id, note);
	}

	remove(id: string) {
		this.notesStore.remove(id);
	}
	upsertMany(notes: Note[]) {
		this.notesStore.upsertMany(notes);
	}
	removeAll() {
		this.notesStore.remove();
	}
}
