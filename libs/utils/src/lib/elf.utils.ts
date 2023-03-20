import { isEqual } from 'lodash';
export const ELF_SYNCABLE_PROPERTIES = ['toSync', 'operation', 'isTest', 'timeUpdate', 'timeCreation'];

export interface ElfSyncable {
	id: string;
	// ownerId:string; -> not mandatory, to set in object model if needed
	toSync?: boolean;
	state?: 'deleted' | 'archived' | 'default';
	timeCreation?: number;
	timeUpdate?: number;
	operation?: 'creation' | 'update' | 'refresh' | null;
}

export function prepEntityForCreation<T extends ElfSyncable>(newEntity: T): T {
	if (newEntity.operation === 'refresh') {
		return { ...newEntity, toSync: false, operation: null };
	}

	const now = Math.round(Date.now() / 1000);
	const newSyncableEntity: T = {
		timeCreation: now,
		...newEntity,
		timeUpdate: now,
		toSync: true,
		operation: 'creation',
	} as T;

	return newSyncableEntity;
}

export function prepEntityForRefresh<T extends ElfSyncable>(newEntity: T, prevEntity?: T): T {
	if (!prevEntity?.id) {
		return { ...newEntity, toSync: false, operation: null };
	}

	if ((newEntity?.timeUpdate ?? newEntity?.timeCreation) == (prevEntity?.timeUpdate ?? newEntity?.timeCreation)) {
		// New entity is the same
		// console.log('%cNew entity is the same', 'color:lightblue', newEntity, prevEntity);
		return { ...newEntity, toSync: false, operation: null };
	} else if ((newEntity?.timeUpdate ?? Infinity) > (prevEntity?.timeUpdate ?? 0)) {
		// New entity is fresher
		// console.log('%cNew entity is fresher', 'color:lightblue', newEntity, prevEntity);
		return { ...newEntity, toSync: false, operation: null };
	} else {
		// Local ahead of server
		// console.log('%cLocal ahead of server', 'color:lightblue', newEntity, prevEntity);
		return { ...prevEntity, toSync: true, operation: 'update' };
	}
}

export function prepEntityForUpdate<T extends ElfSyncable>(newEntity: T, prevEntity: T): T {
	let timeUpdate = Math.round(Date.now() / 1000);
	let toSync = true;
	if (isEqual({ ...newEntity, timeUpdate: null, operation: null }, { ...prevEntity, timeUpdate: null, operation: null })) {
		// if object is equal without considering timeUpdate and operation, then do not update timeUpdate and toSync
		timeUpdate = prevEntity.timeUpdate ?? timeUpdate;
		toSync = newEntity.toSync ?? false;
		// console.log('(prepEntityForUpdate) same entity', newEntity, prevEntity);
	}

	// if previous operation was creation and is not yet synced, then we keep the same operation
	const operation = prevEntity.operation == 'creation' && !!prevEntity.toSync ? 'creation' : 'update';

	const newSyncableEntity: T = {
		...newEntity,
		timeUpdate,
		toSync,
		operation,
	} as T;

	return newSyncableEntity;
}
