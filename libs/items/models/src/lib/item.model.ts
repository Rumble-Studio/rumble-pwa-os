import { ElfSyncable } from '@rumble-pwa/utils';

export interface Item extends ElfSyncable {
	id: string;
	ownerId: string;
	title: string;
	description: string;
	// /** This value is actually an URI starting normally with rs:// */
	// // artworkId?: string; // 'rs:// + id'
	// // artworkUrl?: string;
	/** no prefix rs:// */
	artworkFileId?: string;

	collectionIds?: string[]; // to communicate collection to append item into

	fileId?: string;
	/** List of (collectionId,rankInCollection) */
	ranks?: [string, number][];
}

export interface ItemRank {
	rank: number;
	itemId: string;
	collectionId: string;
	draft?: boolean;
}
