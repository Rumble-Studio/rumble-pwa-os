import { Syncable } from '../../others/types';
import { PlaylistItem } from '../playlists/playlistItem.model';

export interface Mix extends Syncable {
	id: string;
	ownerId: string;
	name: string;
	description: string;
	data?: string; // PlaylistItem[]
	data2?: string; // anything, goal is to keep track of a VirtualPlaylist (see mix item page)
}

// WARNING
export type MixData = PlaylistItem[]; // this is incorrect starting the 21st of july 2022
// WARNING

export interface MixDetails {
	mixId: string;
	exportId?: string;
}

export function createMix(params?: Partial<Mix>) {
	return {
		...params,
	} as Mix;
}
