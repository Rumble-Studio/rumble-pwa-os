import { Injectable } from '@angular/core';
import { RecordingSession } from './recording-session.model';
import { RecordingSessionsStore } from './recording-sessions.store';

@Injectable({ providedIn: 'root' })
export class RecordingSessionsService {
	constructor(private recordingSessionsStore: RecordingSessionsStore) {}

	add(recordingSession: RecordingSession) {
		this.recordingSessionsStore.add(recordingSession);
	}

	update(id: string, recordingSession: Partial<RecordingSession>) {
		this.recordingSessionsStore.update(id, recordingSession);
	}
	upsert(recordingSession: RecordingSession) {
		this.recordingSessionsStore.upsert(recordingSession.id, recordingSession);
	}

	remove(id: string) {
		this.recordingSessionsStore.remove(id);
	}
	upsertMany(recordingSessions: RecordingSession[]) {
		this.recordingSessionsStore.upsertMany(recordingSessions);
	}

	set(recordingSessions: RecordingSession[]) {
		this.recordingSessionsStore.set(recordingSessions);
	}
}
