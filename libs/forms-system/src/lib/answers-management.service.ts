import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Answer, AnswersQuery, AnswersService, RecordingSession } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { sortBy } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, map, take, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class AnswersManagementService {
	answers$$: BehaviorSubject<Answer[]>;
	constructor(
		private restService: RestService,
		private answersService: AnswersService,
		private answersQuery: AnswersQuery,
		private _usersRepository: UsersRepository
	) {
		this.answers$$ = this.answersQuery.answers$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get answers data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Answer[]>('/answers').subscribe((answerApis) => {
					// upsert answers to local store
					this.answersService.upsertMany(
						answerApis.map((answerApis) => {
							return { ...answerApis, operation: 'refresh' };
						})
					);
				});
		});
	}

	pullDataOnce(callback?: () => void) {
		// get answers data from server
		this._usersRepository.isConnected$$.pipe(take(1)).subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Answer[]>('/answers').subscribe((answerApis) => {
					// upsert answers to local store
					this.answersService.upsertMany(
						answerApis.map((answerApis) => {
							return { ...answerApis, operation: 'refresh' };
						})
					);
					if (callback) callback();
				});
		});
	}

	pushData() {
		this.answersQuery.answersToSync$.pipe(debounceTime(300)).subscribe((answers) => {
			answers.forEach((answer) => {
				if (!answer.formId) return;
				if (answer?.operation === 'creation') {
					this._postToServer(answer);
				} else if (answer?.operation === 'update') this._putToServer(answer);
			});
		});
	}

	public add(data: Answer) {
		this.answersService.add(data);
	}
	public update(id: string, data: Partial<Answer>) {
		this.answersService.update(id, data);
	}
	public upsert(data: Answer) {
		this.answersService.upsert(data);
	}
	public removeFromStore(id: string) {
		this.answersService.remove(id);
	}
	public delete(id: string) {
		this.answersService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.answersService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.answersService.update(id, { state: 'default' });
	}

	public get(id: string) {
		return this.answersQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.answersQuery.selectEntity(id);
	}

	public getAll$() {
		return this.answersQuery.selectAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getAll() {
		return this.answersQuery.getAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	//
	// SERVER SYNC
	//
	private _putToServer(answer: Answer) {
		return this.restService
			.put<Answer>('/answers/' + answer.id, answer)
			.pipe(
				tap((r) => {
					this.answersService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(answer: Answer) {
		return this.restService
			.post<Answer>('/answers', answer)
			.pipe(
				tap((r) => {
					this.answersService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	// CUSTOM FN ANSWERS

	public getFormAnswers$(formId: string): Observable<Answer[]> {
		return this.answersQuery
			.selectAll({
				filterBy: (entity) =>
					entity.formId === formId && ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
			})
			.pipe(map((answers) => sortBy(answers, 'recordingSessionId')));
	}
	public getPersonalFormAnswers$(formId: string, userId?: string): Observable<Answer[]> {
		return this.answersQuery
			.selectAll({
				filterBy: (entity) =>
					entity.formId === formId &&
					entity.userId === (userId ?? this._usersRepository.connectedUser$$.value?.id) &&
					['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
			})
			.pipe(map((answers) => sortBy(answers, 'recordingSessionId')));
	}
	public getPersonalFormAnswers(formId: string, userId?: string): Answer[] {
		return this.answersQuery.getAll({
			filterBy: (entity) =>
				entity.formId === formId &&
				entity.userId === (userId ?? this._usersRepository.connectedUser$$.value?.id) &&
				['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	// SESSION MANAGEMENT

	// getSessionForForm(formId?: string): string | undefined {
	//   // create a session if none exists

	//   if (!formId) {
	//     return undefined;
	//   }
	//   const d = new Date();
	//   const now = d.getTime();
	//   let sessionId = '' + now;

	//   const answers = this.getPersonalFormAnswers(formId);
	//   const sessionIds = uniq(answers.map((a) => a.sessionId)).sort();
	//   if (sessionIds.length >= 1) {
	//     sessionId = sessionIds[sessionIds.length - 1];
	//   }
	//   return sessionId;
	// }

	getAnswersForSession(recordingSessionId: RecordingSession['id']): Answer[] {
		return this.answersQuery.getAll({
			filterBy: (entity) =>
				entity.recordingSessionId === recordingSessionId &&
				['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}
	getAnswersForSession$(recordingSessionId: RecordingSession['id']): Observable<Answer[]> {
		return this.answersQuery.selectAll({
			filterBy: (entity) =>
				entity.recordingSessionId === recordingSessionId &&
				['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}
}
