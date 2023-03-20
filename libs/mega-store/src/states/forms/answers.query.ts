import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AnswersStore, AnswersState } from './answers.store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Answer } from './answer.model';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { RecordingSessionsQuery } from './recording-sessions.query';

@Injectable({ providedIn: 'root' })
export class AnswersQuery extends QueryEntity<AnswersState> {
	answers$: Observable<Answer[]> = this.selectAll({
		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
	});
	answers$$: BehaviorSubject<Answer[]> = new BehaviorSubject<Answer[]>([] as Answer[]);

	answersToSync$: Observable<Answer[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(
		switchMap((answers) => {
			// to ensure to only sync answers if recording session is synced
			const answersWithRecordingSessionState$ = answers.map((answer) =>
				this.recordingSessionQuery.selectEntity(answer.recordingSessionId).pipe(
					map((recordingSession) => {
						return {
							answer,
							recordingSessionSynced: recordingSession?.toSync === false,
						};
					})
				)
			);

			return combineLatest(answersWithRecordingSessionState$);
		}),
		map(
			(answersWithRecordingSessionState) =>
				answersWithRecordingSessionState.filter((ar) => ar.recordingSessionSynced).map((ar) => ar.answer),
			debounceTime(300)
		)
	);

	constructor(protected store: AnswersStore, private recordingSessionQuery: RecordingSessionsQuery) {
		super(store);
		this.answers$.subscribe(this.answers$$);
	}
}
