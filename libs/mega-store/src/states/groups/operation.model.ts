import { Syncable } from '../../others/types';
export interface Operation extends Syncable {
	id: string;
	ownerId: string; // this is a groupId (it's groupOwned, not userOwned)
	name: string;
	kind: string;
	key: string;
	description?: string;
	details?: string;
	groupId?: string;
}

export function createOperation(params?: Partial<Operation>) {
	return {
		...params,
	} as Operation;
}
