import { Howl } from 'howler';

export interface MetaHowl {
	howl: Howl | null;
	duration: number;
	loaded: boolean;
	valid: boolean;
	position: number;
	percentage: number;
	origin: 'local' | 'server' | 'unknown';
	mp3: boolean;
}

export interface Song {
	id: string;
	fileSrc?: string;
	songTitle: string;
	songCover?: string;
	author?: string;
	albumCover?: string;
	albumTitle?: string;
	inactive?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	extra?: any;
}
