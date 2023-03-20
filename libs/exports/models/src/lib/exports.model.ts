import { VirtualPlaylist } from '@rumble-pwa/player/services';
import { ElfSyncable } from '@rumble-pwa/utils';

export interface EntityExport extends ElfSyncable {
	id: string;
	ownerId: string; // group id
	name?: string;
	description?: string;
	taskId?: string;
	mixId?: string;
	fileId?: string;
	subscriptionId?: string;

	duration?: number;

	data?: string; // json string, parse with as VirtualExportRequestData
	resultData?: string; // json string, parse as ExportResultData
}

export interface VirtualExportRequestData {
	virtualPlaylists: VirtualPlaylist[];
	exportName?: string;
	audioFormat?: 'wav' | 'mp3' | 'flac';
	onlyRawData?: boolean;
	exportSource?: {
		id: string; // ex: mix.id | form.id
		kind: string; // ex: mix | form
		details?: 'manual export from mix' | 'bunch export from form' | 'bunch export from recording-session list';
		displayNameAtExportTime?: string;
	};
	estimatedExportDuration?: number;
	displayMixWarning?: boolean;
}

export interface VirtualExportResult {
	export: EntityExport | undefined;
	exportRequest: VirtualExportRequestData;
}

export interface ExportDetails {
	subscription?: EntityExport;
}

export interface ExportResultData {
	playlists: { fileId: string; playlistName: string; playlistIndex: number }[];
	archive?: { fileId: string; fileName: string };
}
