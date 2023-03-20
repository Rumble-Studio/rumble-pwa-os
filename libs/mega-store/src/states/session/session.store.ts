// import { Injectable } from '@angular/core';
// import { Store, StoreConfig } from '@datorama/akita';

// export interface SessionState {
// 	token: string | null;
// }

// export function createSessionInitialState(params?: Partial<SessionState>): SessionState {
// 	return {
// 		token: null,
// 		...params,
// 	};
// }

// @Injectable({ providedIn: 'root' })
// @StoreConfig({ name: 'session', resettable: true })
// export class SessionStore extends Store<SessionState> {
// 	constructor() {
// 		super(createSessionInitialState());
// 	}

// 	login(session: SessionState) {
// 		this.update(session);
// 	}

// 	logout() {
// 		this.update(createSessionInitialState());
// 	}
// }
