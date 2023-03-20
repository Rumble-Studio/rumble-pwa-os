export interface AudioPackItem {
	id: string;
	fileId: string;
	audioTitle: string;
	audioDescription?: string;
	// audioTags: string[]; // old version obsolete
	// serverUrl?: string; // old version obsolete
}

export interface AudioPack {
	id: string;
	name: string;
	audioPackItems: AudioPackItem[];
	timeCreation?: number;
}
