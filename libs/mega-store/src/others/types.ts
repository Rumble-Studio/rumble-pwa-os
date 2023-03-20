export const SYNCABLE_PROPERTIES = ['toSync', 'operation', 'isTest', 'timeUpdate', 'timeCreation'];

export interface Syncable {
	id: string;
	// ownerId:string; -> not mandatory, to set in object model if needed
	toSync?: boolean;
	state?: 'deleted' | 'archived' | 'default';
	timeCreation?: number;
	timeUpdate?: number;
	operation?: 'creation' | 'update' | 'refresh' | 'markAsSynced' | null;
}
