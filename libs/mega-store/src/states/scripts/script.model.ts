import { Syncable } from '../../others/types';
export interface Script extends Syncable {
	id: string;
	title: string;
	body: string;
	// anonymousAllow: boolean;
	description?: string;
	ownerId: string;
	isTemplate?: boolean;
	data?: string;
}

export interface ScriptData {
	isOffline?: boolean;
	preventEditing?: boolean;
	sharedWith?: string[];
}

export function createScript(params?: Partial<Script>) {
	return {
		...params,
	} as Script;
}
