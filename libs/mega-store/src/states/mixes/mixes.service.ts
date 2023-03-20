import { Injectable } from '@angular/core';
import { Mix } from './mix.model';
import { MixesStore } from './mixes.store';

@Injectable({ providedIn: 'root' })
export class MixesService {
	constructor(private mixesStore: MixesStore) {}

	add(mix: Mix) {
		this.mixesStore.add(mix);
	}

	update(id: string, mix: Partial<Mix>) {
		this.mixesStore.update(id, mix);
	}
	upsert(mix: Mix) {
		this.mixesStore.upsert(mix.id, mix);
	}

	remove(id: string) {
		this.mixesStore.remove(id);
	}
	upsertMany(mixes: Mix[]) {
		this.mixesStore.upsertMany(mixes);
	}
	removeAll() {
		this.mixesStore.remove();
	}
}
