import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { RecordingSession } from './recording-session.model';
import { RecordingSessionsState, RecordingSessionsStore } from './recording-sessions.store';

@Injectable({ providedIn: 'root' })
export class RecordingSessionsQuery extends QueryEntity<RecordingSessionsState> {
	recordingSessions$: Observable<RecordingSession[]> = this.selectAll({
		filterBy: (entity) => ['deleted'].indexOf(entity.state || 'default') == -1,
	});
	recordingSessions$$: BehaviorSubject<RecordingSession[]> = new BehaviorSubject<RecordingSession[]>(
		[] as RecordingSession[]
	);
	recordingSessionsToSync$: Observable<RecordingSession[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: RecordingSessionsStore) {
		super(store);
		this.recordingSessions$.subscribe(this.recordingSessions$$);
	}
}
