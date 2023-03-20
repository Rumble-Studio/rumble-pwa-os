import { Syncable } from '../../others/types';

export interface Notification extends Syncable {
	id: string;
	ownerId: string;
	title: string;
	description?: string;
	kind: string;
	targetKind?: string;
	targetId?: string;
	details?: string;
	hasSeenByIds: { [key: string]: boolean };
	concernedGroupIds: string[];
}
