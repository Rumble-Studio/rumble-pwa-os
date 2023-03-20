import { Syncable } from '../../others/types';

export interface Event extends Syncable {
	event_name: string;
	event_kind: string;
	event_source: {
		element: string;
		function: string;
		[key: string]: string;
	};
	event_data: {
		isBrowserEnv: boolean;
		getLanguage: string;
		getLocation: Location;
		getHost: string;
		getTopDomain: string;
		getReferrer: string;
		getUrlParams: string;
		getUtmData: {
			[key: string]: unknown;
		};
	};
	user_data?: any;
	isTest: boolean;
}

export function createEvent(params?: Partial<Event>) {
	return { ...params } as Event;
}
