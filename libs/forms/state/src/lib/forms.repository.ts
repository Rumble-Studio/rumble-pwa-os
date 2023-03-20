import { createStore, propsFactory, withProps } from '@ngneat/elf';
import {
	withEntities,
	selectAllEntities,
	setEntities,
	addEntities,
	updateEntities,
	deleteEntities,
	withActiveId,
	selectActiveEntity,
	setActiveId,
	withActiveIds,
	selectActiveEntities,
	toggleActiveIds,
	withUIEntities,
	UIEntitiesRef,
} from '@ngneat/elf-entities';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { shareReplay } from 'rxjs/operators';
import { Form, FormCustomisationDetails } from '@rumble-pwa/mega-store';

const storeName = 'forms';

export interface FormUI {
	id: Form['id'];
	formCustomisation?: FormCustomisationDetails;
}
export interface FormProps {
	stepIdFocused: string | null | undefined;
}

export const DEFAULT_FORM_PROPS: FormProps = {
	stepIdFocused: undefined,
};

export const FEATURE_FORM_PIPES = propsFactory('form', { initialValue: DEFAULT_FORM_PROPS });

@Injectable({ providedIn: 'root' })
export class FormsRepository {
	public forms$: Observable<Form[]>;
	public formUIs$: Observable<FormUI[]>;
	public activeForms$: Observable<Form[]>;
	public activeForm$: Observable<Form | undefined>;
	public formProps$: Observable<FormProps>;
	private _persist;

	private _store;

	constructor() {
		this._store = this._createStore();
		this._persist = persistState(this._store, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.forms$ = this._store.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.formUIs$ = this._store.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeForm$ = this._store.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeForms$ = this._store.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.formProps$ = this._store.pipe(FEATURE_FORM_PIPES.selectForm());
	}

	public setForms(forms: Form[]) {
		this._store.update(setEntities(forms));
	}

	public addForm(form: Form) {
		this._store.update(addEntities(form));
	}

	public updateForm(id: Form['id'], form: Partial<Form>) {
		this._store.update(updateEntities(id, form));
	}

	public deleteForm(id: Form['id']) {
		this._store.update(deleteEntities(id));
	}

	public setActiveId(id: Form['id']) {
		this._store.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<Form['id']>) {
		this._store.update(toggleActiveIds(ids));
	}

	public setFormProps(formProps: Partial<FormProps>) {
		this._store.update(FEATURE_FORM_PIPES.updateForm(formProps));
	}

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Form>(),
			withUIEntities<FormUI>(),
			FEATURE_FORM_PIPES.withForm(),
			withActiveId(),
			withActiveIds()
		);

		return store;
	}
}
