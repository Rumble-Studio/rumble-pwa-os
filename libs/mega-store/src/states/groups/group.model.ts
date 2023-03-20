import { Grant } from './grant.model';
import { Syncable } from '../../others/types';
export interface Group extends Syncable {
	id: string;
	name: string;
	description?: string;
	kind: string;
	children?: Group[];
	// parents?: Group[];
	grants?: Grant[]; // backref relationship
	parentIds?: string[]; // server property
	childIds?: string[]; // server property
	originGroup?: Group; // local only
}

export interface GroupDetails {
	group?: Group;
	kind?: string;
	parent?: Group;
	preventRedirect?: boolean;
}

export function createGroup(params?: Partial<Group>) {
	return {
		...params,
	} as Group;
}
