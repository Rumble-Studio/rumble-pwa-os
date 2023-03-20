import { Syncable } from '../../others/types';

export interface Step extends Syncable {
	id: string;
	// ownerId: string;
	rank: number;
	formId: string;
	selected?: boolean; // local only, for display purposes

	kind: string;
	attrs: string;

	source?: string; // editor | auto | ai
}

export function createStep(params?: Partial<Step>) {
	return {
		...params,
	} as Step;
}
