import { Injectable } from '@angular/core';
import { Operation } from './operation.model';
import { OperationsStore } from './operations.store';

@Injectable({ providedIn: 'root' })
export class OperationsService {
	constructor(private operationsStore: OperationsStore) {}

	add(operation: Operation) {
		this.operationsStore.add(operation);
	}

	update(id: string, operation: Partial<Operation>) {
		this.operationsStore.update(id, operation);
	}
	upsert(operation: Operation) {
		this.operationsStore.upsert(operation.id, operation);
	}

	remove(id: string) {
		this.operationsStore.remove(id);
	}

	removeAll() {
		this.operationsStore.remove();
	}

	upsertMany(operations: Operation[]) {
		this.operationsStore.upsertMany(operations);
	}
}
