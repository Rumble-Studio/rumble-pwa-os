import { ElfSyncable } from '@rumble-pwa/utils';

export interface Collection extends ElfSyncable {
	id: string;
	ownerId: string;

	title: string;
	description?: string;
	languageId?: string;
	isExplicit?: boolean;
	customWebsite?: string;
	artworkFileId?: string;
	categoryIds: Category['id'][];
	publicAuthorName: string;
	publicAuthorEmail: string;
	typeId: string;

	/** List of (itemId,indexInCollection) */
	ranks?: [string, number][];

	rssFile?: string;
	state?: 'default' | 'deleted' | 'archived';
}

export interface Language {
	id: string;
	shortName: string;
	fullName: string;
}

export interface Category {
	id: string;
	macroCategory: string;
	name: string;
}

export interface Type {
	id: string;
	type: string;
	name: string;
	description: string;
	isAvailable: boolean;
}
