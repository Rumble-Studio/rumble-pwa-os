import { Injectable } from '@angular/core';
import { Script } from './script.model';
import { ScriptsStore } from './scripts.store';

@Injectable({ providedIn: 'root' })
export class ScriptsService {
	constructor(private scriptsStore: ScriptsStore) {}

	add(script: Script) {
		this.scriptsStore.add(script);
	}

	update(id: string, script: Partial<Script>) {
		this.scriptsStore.update(id, script);
	}
	upsert(script: Script) {
		this.scriptsStore.upsert(script.id, script);
	}

	remove(id: string) {
		this.scriptsStore.remove(id);
	}

	removeAll() {
		this.scriptsStore.remove();
	}

	upsertMany(scripts: Script[]) {
		this.scriptsStore.upsertMany(scripts);
	}
}
