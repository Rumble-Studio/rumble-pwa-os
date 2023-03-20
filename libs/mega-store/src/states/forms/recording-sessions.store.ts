import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { RecordingSession } from './recording-session.model';

export interface RecordingSessionsState extends EntityState<RecordingSession> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'recording-sessions', resettable: true })
@ToSync<RecordingSession>()
export class RecordingSessionsStore extends EntityStore<RecordingSessionsState> {
	constructor() {
		super();
	}
}
