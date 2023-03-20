import { Syncable } from '../../others/types';
export interface Permission extends Syncable {
	id: string;
	name: string;
	description?: string;
	key: string;
	enabled: boolean;
	needGroup: boolean;
}

export function createPermission(params?: Partial<Permission>) {
	return {
		...params,
	} as Permission;
}
