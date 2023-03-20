export type CONTROL_PLAYER_STATE = 'playing' | 'paused' | 'stopped';
export type CONTROL_PLAYER_REQUEST = 'play' | 'pause' | 'stop' | 'next' | 'prev' | null;

export type PLAYLIST_ITEM_KINDS =
	| 'mix'
	| 'item'
	| 'file'
	| 'playlist'
	| 'collection'
	| 'recording-session'
	| 'jingle'
	| 'audio-pack-item';

export interface PlaylistItem {
	/** unique id for list updates (not necessarily DB related) Mandatory to enable sorting and other operations */
	id: string;

	title?: string;
	description?: string;

	/** for display */
	label?: string;

	/** id of the source element like collection.id */
	objectId?: string;
	/** object type of the source */
	objectKind?: PLAYLIST_ITEM_KINDS;
	// sourceCategory?: SourceCategory; // for AudioItem

	nodeKind?: string;

	contentKind: 'playlist' | 'file';
	/**  object type of the source */
	contentId: string; // x

	rank?: number;
	details?: {
		userId?: string;
		/** TODO: to convert to `User` once the playlist is into a repository */
		user?: any;
	};

	// sourceData?: User; // old property, kept for retro-compatibility
}

export interface SourceCategory {
	id: string;
	name: string;
	priority: number;
}

export const AUDIO_SOURCE_CATEGORIES: { [key: string]: SourceCategory } = {
	jingles: {
		id: 'jingles',
		name: 'Your jingles',
		priority: 0,
	},
	interview: {
		id: 'interview',
		name: 'Interviews',
		priority: 1,
	},
	recording: {
		id: 'recording',
		name: 'Recording',
		priority: 2,
	},
	others: {
		id: 'others',
		name: 'Others',
		priority: 3,
	},
};

export interface GlobalPlayerServiceSettings {
	playlistIdentifier?: string; // id of the playlist concerned by the global player: only ONE playlist can be referenced by the global player
	title?: string;
	description?: string;

	// where does this global playlist come from?
	source?: {
		objectId: string;
		objectKind: PLAYLIST_ITEM_KINDS;
	};

	// Settings for the global playlist
	playlist: {
		collapsed: boolean;

		// Settings to display items in the global playlist
		playlistItemsSettings: {
			canDrag?: boolean;
			displayTranscript: boolean;
			showHandle?: boolean;
			canEdit?: boolean;
			displayEditable?: boolean;
		};
	};

	// Settings for the global playbar
	playbar: {
		collapsed: boolean;
		pictureSRCs?: string[];
		duration?: number;
	};

	customHeight?: number;
	autoPlay: boolean;
	closed: boolean;
}

export interface GlobalPlayerServiceState {
	playingState?: CONTROL_PLAYER_STATE;
	currentIndex?: number;
	currentDuration: number;
	curentIndexPercentage?: number;
	totalDuration: number;
	percentage: number;
	durations?: { [key: number]: number };
}

export const DEFAULT_GLOBAL_PLAYER_SETTINGS: GlobalPlayerServiceSettings = {
	playlist: {
		collapsed: true,
		playlistItemsSettings: {
			displayTranscript: true,
		},
	},
	playbar: {
		collapsed: true,
	},

	closed: false,
	autoPlay: false,
};

export const DEFAULT_GLOBAL_PLAYER_STATE: GlobalPlayerServiceState = {
	currentDuration: 0,
	totalDuration: 0,
	percentage: 0,
};
