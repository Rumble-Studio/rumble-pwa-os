import { ElfSyncable } from '@rumble-pwa/utils';
import { AttrElement } from '@rumble-pwa/utils';

export interface User extends ElfSyncable {
	id: string;
	email: string;
	fullName: string;
	firstName?: string;
	lastName?: string;
	isTest: boolean;
	isSuperuser?: boolean;
	isActive: boolean;
	isGuestOnly?: boolean;
	newsletterSubscribed: boolean;
	hasPassword?: boolean;
	invited?: boolean;
	emailValidated?: boolean;
	anonymous?: boolean;
	data?: string;
	publicData?: string;
	lastLogin?: number;
	stripeCustomerId?: string;
	pennylaneCustomerId?: string;
}

export function convertUserToDisplayableName(user: User) {
	if (user.firstName && user.lastName) {
		return user.firstName + ' ' + user.lastName;
	} else if (user.firstName) {
		return user.firstName;
	} else if (user.lastName) {
		return user.lastName;
	}
	return user.fullName;
}

export type FAVORITE_OBJECT_KINDS =
	| 'playlist'
	| 'file'
	| 'item'
	| 'collection'
	| 'recording-session'
	| 'mix'
	| 'audio-pack-item'
	| 'track' // => also used by the virtual playlist recorder
	| 'step';

export interface FavoriteObject {
	objectId: string; //id of the object, it could be an item, a playlist, a file, etc...
	objectKind: FAVORITE_OBJECT_KINDS;
	isFavorite: boolean;
	lastEditDate: number;
}

export interface UserHistory {
	formStateList: {
		[interviewId: string]: {
			state: 'closed' | 'completed';
		};
	};
}

/**
 * The user's attributes.
 * @param history list of some forms alredy displayed to the user (like the onboarding inteview)
 *
 */
export interface UserData {
	favorites?: FavoriteObject[];
	history?: UserHistory;
	profilePictureUrl?: string | null;
	[key: string]: AttrElement | FavoriteObject[] | UserHistory;
}
// operations [operationName:string]:date -> relative to appSumo operations
// todo.XXX: all todo states
