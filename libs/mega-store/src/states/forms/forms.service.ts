import { Injectable } from '@angular/core';
import { Form } from './form.model';
import { FormsStore } from './forms.store';

@Injectable({ providedIn: 'root' })
export class FormsService {
	constructor(private formsStore: FormsStore) {}

	add(form: Form) {
		this.formsStore.add(form);
	}

	update(id: string, form: Partial<Form>) {
		this.formsStore.update(id, form);
	}
	upsert(form: Form) {
		this.formsStore.upsert(form.id, form);
	}

	remove(id: string) {
		this.formsStore.remove(id);
	}

	removeAll() {
		this.formsStore.remove();
	}

	upsertMany(forms: Form[]) {
		this.formsStore.upsertMany(forms);
	}
}
