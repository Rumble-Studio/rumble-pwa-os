import { Injectable } from '@angular/core';
import { Step } from './step.model';
import { StepsStore } from './steps.store';

@Injectable({ providedIn: 'root' })
export class StepsService {
	constructor(private stepsStore: StepsStore) {}

	add(step: Step) {
		this.stepsStore.add(step);
	}

	update(id: string, step: Partial<Step>) {
		this.stepsStore.update(id, step);
	}
	upsert(step: Step) {
		this.stepsStore.upsert(step.id, step);
	}

	remove(id: string) {
		this.stepsStore.remove(id);
	}

	removeAll() {
		this.stepsStore.remove();
	}

	upsertMany(steps: Step[]) {
		this.stepsStore.upsertMany(steps);
	}
}
