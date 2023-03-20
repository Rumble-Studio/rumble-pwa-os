import { Injectable } from '@angular/core';
import { Answer } from './answer.model';
import { AnswersStore } from './answers.store';

@Injectable({ providedIn: 'root' })
export class AnswersService {
	constructor(private answersStore: AnswersStore) {}

	add(answer: Answer) {
		this.answersStore.add(answer);
	}

	update(id: string, answer: Partial<Answer>) {
		this.answersStore.update(id, answer);
	}
	upsert(answer: Answer) {
		this.answersStore.upsert(answer.id, answer);
	}

	remove(id: string) {
		this.answersStore.remove(id);
	}

	removeAll() {
		this.answersStore.remove();
	}

	upsertMany(answers: Answer[]) {
		this.answersStore.upsertMany(answers);
	}
}
