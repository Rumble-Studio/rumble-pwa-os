import { Syncable } from '../../others/types';

export interface Task extends Syncable {
	id: string;
	title: string;
	description: string;
	kind: string;
	submitted: boolean;
	progress: number;
	complete: boolean;
	failed: boolean;
	processingId: string;
	method: string;
	argsJson: string;
	kwargsJson: string;
	brokerCleaned: boolean;
	resultJson: string;
	ownerId: string;
	timeCreation: number;
	timeUpdate: number;
	isTest: boolean;
}

export function createTask(params?: Partial<Task>) {
	return {
		...params,
	} as Task;
}
