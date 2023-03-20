// export const ALLOWED_AUDIO_EXTENSIONS: string[] = [
// 	'ogg',
// 	'aac',
// 	'midi',
// 	'mp3',
// 	'm4a',
// 	'wav',
// 	'wma',
// 	'flac',
// 	'mka',
// 	'3g2',
// 	'3gp',
// 	'webm',
// ];

// export const ALLOWED_VIDEO_EXTENSIONS: string[] = ['avi', 'flv', 'mkv', 'mov', 'mp4', 'mpg', 'wmv', 'webm'];
// export const ALLOWED_IMAGE_EXTENSIONS: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ppm', 'svg', 'tiff'];

// export type MacroFileKindDefined = 'video' | 'audio' | 'image' | 'document';
// export type MacroFileKind = undefined | MacroFileKindDefined;

// export const ALL_MACRO_FILE_KINDS: MacroFileKind[] = ['video', 'audio', 'image'];

// export const MACRO_FILE_KIND_TO_ALLOWED_EXTENSIONS: {
// 	[keyof in MacroFileKindDefined]: string[];
// } = {
// 	video: ALLOWED_VIDEO_EXTENSIONS,
// 	audio: ALLOWED_AUDIO_EXTENSIONS,
// 	image: ALLOWED_IMAGE_EXTENSIONS,
// 	document: [], // nothing accepted yet for documents
// };

// export function convertExtensionToMacroFileKind(extension: string): MacroFileKind {
// 	if (ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
// 		return 'video';
// 	} else if (ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
// 		return 'audio';
// 	} else if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
// 		return 'image';
// 	} else {
// 		return undefined;
// 	}
// }

// export function convertFileTypeToMacroFileKind(fileType: string): MacroFileKind {
// 	if (fileType === 'video') {
// 		return 'video';
// 	} else if (fileType === 'audio') {
// 		return 'audio';
// 	} else if (fileType === 'image') {
// 		return 'image';
// 	} else {
// 		return undefined;
// 	}
// }
