import { Syncable } from '../../others/types';

export interface Note extends Syncable {
	id: string;
	ownerId: string;
	title: string;
	description?: string;
	body?: string;
	data?: string;
}

export interface NoteDetails {
	noteId: string;
	exportId?: string;
}

export interface NoteData {
	data?: string;
}
