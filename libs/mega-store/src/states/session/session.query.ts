// import { Injectable } from '@angular/core';
// import { Query } from '@datorama/akita';
// import { isEqual } from 'lodash';
// import { Observable } from 'rxjs';
// import { filter, map, shareReplay, tap } from 'rxjs/operators';
// import { createSessionInitialState, SessionState, SessionStore } from './session.store';

// @Injectable({ providedIn: 'root' })
// export class SessionQuery extends Query<SessionState> {
// 	session: SessionState = createSessionInitialState();
// 	session$: Observable<SessionState> = this.select().pipe(
// 		filter((session) => !isEqual(this.session, session)),
// 		tap((session) => {
// 			this.session = session;
// 		}),
// 		shareReplay()
// 	);

// 	isLoggedIn?: boolean;
// 	isLoggedIn$: Observable<boolean> = this.session$.pipe(
// 		map(({ token }) => !!token),
// 		filter((isLoggedIn) => !isEqual(this.isLoggedIn, isLoggedIn)),
// 		tap((isLoggedIn) => {
// 			this.isLoggedIn = isLoggedIn;
// 		})
// 	);

// 	constructor(protected store: SessionStore) {
// 		super(store);
// 	}
// }
