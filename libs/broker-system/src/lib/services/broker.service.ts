import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export enum BROKE_OPTIONS {
	'stopRecording' = 'stopRecording', // (forms)
	'stopPlaying' = 'stopPlaying', // (forms)
	'celebrate' = 'celebrate', // (forms)
	'celebrateReset' = 'celebrateReset', // (forms)
	'rr' = 'rr', // rick roll
	'preloadSongs' = 'preloadSongs', // player service load howls (forms)
	'resetHelpers' = 'resetHelpers', // UserData undone on todo (todo).
	'launchGuidedTour' = 'launchGuidedTour', // launch undone todos registered (todo)
	'create-branding-kit' = 'create-branding-kit', // create branding kit (todo)
	'create-interview' = 'create-interview', // create branding kit (todo)
	'refresh-notifications' = 'refresh-notifications', // refresh notifications
}

export type BrokerOptions = keyof typeof BROKE_OPTIONS;

@Injectable({
	providedIn: 'root',
})
export class BrokerService {
	broker$ = new Subject<BrokerOptions | string>();

	broke(msg: BrokerOptions | string) {
		this.broker$.next(msg);
	}
}
