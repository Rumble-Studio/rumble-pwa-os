import { Syncable } from '../../others/types';
export interface Grant extends Syncable {
	id: string;
	permissionId: string;
	groupId: string;

	parameters?: string;
	methodName?: string;
}
export function createGrant(params?: Partial<Grant>) {
	return {
		...params,
	} as Grant;
}
