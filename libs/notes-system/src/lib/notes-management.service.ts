import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Note, NoteData, NotesQuery, NotesService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { merge, sortBy } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, map, take, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class NotesManagementService {
	notes$$: BehaviorSubject<Note[]>;
	notes$: Observable<Note[]>;

	constructor(
		private restService: RestService,
		private notesService: NotesService,
		private notesQuery: NotesQuery,
		private _usersRepository: UsersRepository
	) {
		// console.log('%c NotesManagementService', 'color: #00a7e1; font-weight: bold');

		this.notes$$ = this.notesQuery.notes$$;
		this.notes$ = this.notesQuery.notes$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get notes data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Note[]>('/notes').subscribe((noteApis) => {
					this.notesService.upsertMany(
						noteApis.map((noteApi) => {
							return { ...noteApi, operation: 'refresh' };
						})
					);
				});
		});
	}

	pushData() {
		this.notesQuery.notesToSync$.pipe(debounceTime(1000)).subscribe((notes) => {
			notes.forEach((note) => {
				if (note?.operation === 'creation') {
					this._postToServer(note);
				} else if (note?.operation === 'update') this._putToServer(note);
			});
		});
	}

	addData(noteId: string, dataToAdd: NoteData) {
		const target = {};
		const currentDataAsStr = this.get(noteId)?.data;
		const currentData: NoteData = currentDataAsStr ? JSON.parse(currentDataAsStr) : {};
		merge(target, currentData, dataToAdd);
		this.notesService.update(noteId, { data: JSON.stringify(target) });
	}

	public add(data: Note) {
		this.notesService.add(data);
	}
	public update(id: string, data: Partial<Note>) {
		this.notesService.update(id, data);
	}
	public removeFromStore(id: string) {
		this.notesService.remove(id);
	}
	public delete(id: string) {
		this.notesService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.notesService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.notesService.update(id, { state: 'default' });
	}

	public getAll$(includeArchived = false) {
		return this.notesQuery
			.selectAll({
				filterBy: (entity) =>
					['deleted', ...(includeArchived ? [] : ['archived'])].indexOf(entity.state || 'default') == -1,
			})
			.pipe(map((notes) => sortBy(notes, 'timeCreation')));
	}

	public getAll() {
		return this.notesQuery.notes$$.getValue();
	}

	public get(id: string) {
		return this.notesQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.notesQuery.selectEntity(id);
	}

	//
	// SERVER SYNC
	//
	private _putToServer(note: Note) {
		return this.restService
			.put<Note>('/notes/' + note.id, note)
			.pipe(
				tap((r) => {
					this.notesService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(note: Note) {
		return this.restService
			.post<Note>('/notes', note)
			.pipe(
				tap((r) => {
					this.notesService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
}
