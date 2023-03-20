import { Syncable } from '../../others/types';

export interface Playlist extends Syncable {
	id: string;
	title?: string;
	description?: string;
	ownerId: string;
}
