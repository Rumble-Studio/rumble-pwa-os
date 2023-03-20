import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Step, StepsQuery, StepsService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { TracksRepository } from '@rumble-pwa/tracks/state';
import { UsersRepository } from '@rumble-pwa/users/state';
import { AttrElement } from '@rumble-pwa/utils';
import { isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter, startWith, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { ALL_STEP_INSTANCES, KIND_COPIABLE, StepInstance } from './config/steps.config';

@Injectable({
	providedIn: 'root',
})
export class StepsManagementService {
	steps$$: BehaviorSubject<Step[]>;

	constructor(
		private restService: RestService,
		private stepsService: StepsService,
		private stepsQuery: StepsQuery,
		private _usersRepository: UsersRepository,
		private _tracksRepository: TracksRepository
	) {
		this.steps$$ = this.stepsQuery.steps$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get steps data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Step[]>('/steps').subscribe((stepApis) => {
					// upsert steps to local store
					this.stepsService.upsertMany(
						stepApis.map((stepApis) => {
							return { ...stepApis, operation: 'refresh' };
						})
					);
				});
		});
	}

	pushData() {
		this.stepsQuery.stepsToSync$.pipe(debounceTime(300)).subscribe((steps) => {
			steps.forEach((step) => {
				if (step?.operation === 'creation') {
					this._postToServer(step);
				} else if (step?.operation === 'update') this._putToServer(step);
			});
		});
	}

	public add(data: Step) {
		this.stepsService.add(data);
	}
	public update(id: string, data: Partial<Step>) {
		// console.log('Upserting form', who);
		// if (this.get(id)?.sc !== this.usersRepository.connectedUser$$.value?.id) {
		//   console.warn("You can't upsert a script that is not yours");
		//   return;
		// }
		this.stepsService.update(id, data);
	}
	public upsert(data: Step) {
		// console.log('Upserting form', who);
		// if (this.get(data.id)?.ownerId !== this.usersRepository.connectedUser$$.value?.id) {
		//   console.warn("You can't upsert a script that is not yours");
		//   return;
		// }
		this.stepsService.upsert(data);
	}
	public upsertMany(data: Step[]) {
		this.stepsService.upsertMany(data);
	}
	public removeFromStore(id: string) {
		this.stepsService.remove(id);
	}
	public delete(id: string) {
		this.stepsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.stepsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.stepsService.update(id, { state: 'default' });
	}

	public get(id: string) {
		return this.stepsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.stepsQuery.selectEntity(id);
	}

	public getAll$() {
		return this.stepsQuery.selectAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getAll() {
		return this.stepsQuery.getAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getFormSteps$(formId: string, includeSources: string[] = []): Observable<Step[]> {
		let steps: Step[] = [];
		return this.stepsQuery
			.selectAll({
				sortBy: 'rank',
				filterBy: (entity) =>
					entity.formId === formId &&
					['deleted', 'archived'].indexOf(entity.state || 'default') == -1 &&
					(entity.source === '' ||
						entity.source === 'editor' ||
						(entity.source ? includeSources.indexOf(entity.source) > -1 : true)),
			})
			.pipe(
				filter((newSteps) => !isEqual(steps, newSteps)),
				tap((newSteps) => (steps = newSteps)),
				startWith(steps)
			);
	}

	public getFormSteps(id: string): Step[] {
		return this.stepsQuery.getAll({
			sortBy: 'rank',
			filterBy: (entity) => entity.formId === id && ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	//
	// SERVER SYNC
	//
	private _putToServer(step: Step) {
		if (step.id.length === 0) this.removeFromStore(step.id);
		return this.restService
			.put<Step>('/steps/' + step.id, step)
			.pipe(
				tap((r) => {
					this.stepsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(step: Step) {
		if (step.id.length === 0) this.removeFromStore(step.id);
		return this.restService
			.post<Step>('/steps', step)
			.pipe(
				tap((r) => {
					this.stepsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	filterOutPrivateSteps(steps: Step[]): Step[] {
		return steps.filter((step) => {
			const attrs = step.attrs ? JSON.parse(step.attrs) : {};
			const isPrivate = attrs.isPrivate === true;
			// if (isPrivate)
			//   console.log('Ignoring this node because private:', step.kind, { step });
			return !isPrivate;
		});
	}

	duplicateStep(step: Step, formId?: string, rank?: number) {
		const attrsAsStr = step.attrs;
		const attrs = JSON.parse(attrsAsStr);

		const stepInstance: StepInstance | undefined = ALL_STEP_INSTANCES.find(
			(stepInstance) => stepInstance.stepDetail.name === step.kind
		);

		if (!stepInstance) throw new Error('This stepInstance does not exist' + step.kind);

		const copiedAttr: { [key: string]: AttrElement } = {};
		// remove non copiable attributes
		Object.keys(attrs).forEach((key) => {
			const stepAttribute = stepInstance.stepDetail.attributes.find((attr) => attr.name === key);

			if (KIND_COPIABLE.includes(stepAttribute?.kind || '')) {
				copiedAttr[key] = attrs[key];
			} else if (key === 'playlistid') {
				const newPlaylistId = this._tracksRepository.duplicatePlaylist(attrs[key]);
				copiedAttr[key] = newPlaylistId;
			} else {
				console.warn('ignoring key while copying', { key });
			}
		});

		const now = Math.round(Date.now() / 1000);

		const newStep: Step = {
			...step,
			id: uuidv4(),
			formId: formId ?? step.formId,
			rank: rank ?? step.rank,
			timeUpdate: now,
			timeCreation: now,
			toSync: true,
			attrs: JSON.stringify(copiedAttr),
		};
		return newStep;
	}
}
