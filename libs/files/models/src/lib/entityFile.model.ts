import { ElfSyncable } from '@rumble-pwa/utils';
import { flatten } from 'lodash';

export const ALLOWED_AUDIO_EXTENSIONS: string[] = [
	'ogg',
	'aac',
	'midi',
	'mp3',
	'm4a',
	'wav',
	'wma',
	'flac',
	'mka',
	'3g2',
	'3gp',
	'webm',
];

export const ALLOWED_VIDEO_EXTENSIONS: string[] = ['avi', 'flv', 'mkv', 'mov', 'mp4', 'mpg', 'wmv', 'webm'];
export const ALLOWED_IMAGE_EXTENSIONS: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ppm', 'svg', 'tiff'];
export const ALLOWED_DOC_EXTENSIONS: string[] = ['zip', 'pdf', 'docx', 'doc', 'xls', 'xlsx', 'csv'];

export type MacroFileKindDefined = 'video' | 'audio' | 'image' | 'document';
export type MacroFileKind = undefined | MacroFileKindDefined;

export const ALL_MACRO_FILE_KINDS: MacroFileKindDefined[] = ['video', 'audio', 'image', 'document'];

export const MACRO_FILE_KIND_TO_ALLOWED_EXTENSIONS: {
	[keyof in MacroFileKindDefined]: string[];
} = {
	video: ALLOWED_VIDEO_EXTENSIONS,
	audio: ALLOWED_AUDIO_EXTENSIONS,
	image: ALLOWED_IMAGE_EXTENSIONS,
	document: ALLOWED_DOC_EXTENSIONS,
};

export function convertKindsToAcceptedExtensions(kinds: MacroFileKindDefined[]): string[] {
	return flatten(kinds.map((macroType) => MACRO_FILE_KIND_TO_ALLOWED_EXTENSIONS[macroType]));
}

export function convertMacroKindsToAcceptedExtensionsString(kinds: MacroFileKindDefined[]): string {
	return kinds
		.map((macroType) => MACRO_FILE_KIND_TO_ALLOWED_EXTENSIONS[macroType].map((extension) => `.${extension}`))
		.join(',');
}

export function convertExtensionToMacroFileKind(extension: string | undefined): MacroFileKind {
	if (!extension) return undefined;
	if (ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
		return 'video';
	} else if (ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
		return 'audio';
	} else if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
		return 'image';
	} else {
		console.warn('Unknown extension:', extension);
		return undefined;
	}
}

export function convertFileTypeToMacroFileKind(fileType: string): MacroFileKind {
	if (fileType === 'video') {
		return 'video';
	} else if (fileType === 'audio') {
		return 'audio';
	} else if (fileType === 'image') {
		return 'image';
	} else {
		return undefined;
	}
}

export interface Filetag {
	id: string;
	title?: string;
	description?: string;
	kind?: 'music' | 'instrument' | 'genre' | 'custom' | 'source' | 'property';
	value?: string;
	extra?: string;
	details?: string;
}

export interface EntityFile extends ElfSyncable {
	id: string;
	fileName: string;
	fileHash?: string;
	fileHashClient: string;
	ownerId: string;
	path?: string;
	// pathClient: string;
	fileOnServer?: boolean;
	fileOnClient?: boolean;
	entryInDb?: boolean;
	// typeClient: TYPE_CLIENT_ENUM;
	// beingUploaded?: boolean;
	// uploadTryCounter?: number;
	// serverUrl?: string; // from server but DEPRECATED => use urls instead
	publicName?: string;
	extension?: string;
	data?: string;
	// originalTranscript?: string; // only local => obsolete (use getTranscriptFromData(entityFile))
	// editedTranscript?: string; // only local => obsolete (use getTranscriptFromData(entityFile, 'edited_manual'))
	kind?: MacroFileKind;
	lastServerUrlUpdate?: number; // from server
	duration?: number;

	filetags?: Filetag[]; // from server (not to write on client)

	/** URLs computed by generate_standard_file methods and updating by a cron job */
	urls?: {
		mp3Ld?: { url: string; lastUrlUpdate: number };
		mp3Hd?: { url: string; lastUrlUpdate: number };
		standard?: { url: string; lastUrlUpdate: number };
		original?: { url: string; lastUrlUpdate: number };
		squareCentered?: { url: string; lastUrlUpdate: number };
		videoStandard?: { url: string; lastUrlUpdate: number };
	};

	/** none if not yet checked, true if mistake will generating
	 *  standard files and false if everything went fine (from server) */
	unprocessable?: boolean;
}

export function convertEntityFileToUrl(entityFile: EntityFile | undefined) {
	if (!entityFile) return undefined;
	if (entityFile.kind === 'audio') {
		return (
			entityFile.urls?.mp3Ld?.url ??
			entityFile.urls?.mp3Hd?.url ??
			entityFile.urls?.standard?.url ??
			entityFile.urls?.original?.url
		);
	} else if (entityFile.kind === 'video') {
		return entityFile.urls?.videoStandard?.url ?? entityFile.urls?.original?.url;
	}
	return entityFile.urls?.original?.url;
}

export type TranscriptSource = 'original_gcp_20210124' | 'original_deepgram_20220620' | 'edited_manual';

export interface EntityFileData {
	duration?: string; // string of a float
	transcripts?: {
		[key in TranscriptSource]: string;
	};
	mediaInfo?: {
		title?: string;
		duration?: number;
		sample_rate?: number;
		channels?: number;
		channel_layout?: string;
		bit_depth?: number;
		bit_rate?: number;
		rms?: number;
		lDBFS?: number;
		size_bytes?: number;
		size_megabytes?: number;
		width?: number;
		height?: number;
	};
}

export function getTranscriptFromData(
	entityFile: EntityFile,
	source: TranscriptSource = 'original_deepgram_20220620'
): string | undefined {
	const dataAsStr: string | undefined = entityFile.data;
	if (!dataAsStr) return undefined;
	const data: EntityFileData = JSON.parse(dataAsStr);

	if (source === 'original_deepgram_20220620' && data.transcripts?.original_deepgram_20220620) {
		return data.transcripts.original_deepgram_20220620;
	}
	if (source === 'original_gcp_20210124' && data.transcripts?.original_gcp_20210124) {
		return data.transcripts.original_gcp_20210124;
	}
	if (source === 'edited_manual' && data.transcripts?.edited_manual) {
		return data.transcripts.edited_manual;
	}
	// return gcp if deepgram not available
	if (source === 'original_deepgram_20220620' && data.transcripts?.original_gcp_20210124) {
		return data.transcripts.original_gcp_20210124;
	}
	return undefined;
}
