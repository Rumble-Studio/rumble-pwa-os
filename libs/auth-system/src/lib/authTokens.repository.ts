import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { createStore, propsFactory } from '@ngneat/elf';
import { selectAllEntities, setEntities, withEntities } from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { RestService } from '@rumble-pwa/requests';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

const storeName = 'authToken';
const storePropsName = 'authTokenProps';

export interface AuthToken {
	id: string;
	token: string;
	userId: string;
}

export interface AuthTokenProps {
	token: null | string;
}

export const DEFAULT_USER_PROPS: AuthTokenProps = {
	token: null,
};

export const USER_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_USER_PROPS,
});

@Injectable({ providedIn: 'root' })
export class AuthTokensRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public authTokens$: Observable<AuthToken[]>;
	public authTokenProps$: Observable<AuthTokenProps>;

	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//
	// (empty)

	/**
	 *
	 * @param _restService
	 * @param _objectPromptService
	 * @param _subscriptionsManagementService  - Used for prompt opening
	 */
	constructor(
		//
		private _restService: RestService,
		private _notificationsService: NotificationsService,
		private _activatedRoute: ActivatedRoute,
		private _router: Router
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.authTokens$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this.authTokenProps$ = this._store$$.pipe(
			USER_PROPS_PIPES.selectAuthTokenProps(),
			// tap((authTokenProps) => {
			// 	console.log('authTokenProps$', authTokenProps);
			// }),
			shareReplay({ refCount: true })
		);

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//
		// (empty)

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//
		this._activatedRoute.queryParamMap
			.pipe(
				tap((params) => {
					const accessToken = params.get('token');
					const orderParam = params.get('order');
					const redirectUrl = params.get('redirectUrl');

					// console.log({
					// 	accessToken,
					// 	orderParam,
					// 	redirectUrl,
					// });

					if (accessToken) {
						this.setAuthTokenProps({
							token: accessToken,
						});

						if (redirectUrl) {
							this._router.navigate([redirectUrl]);
							return;
						}
						if (orderParam) {
							this._router.navigate(['/profile'], {
								queryParams: { order: orderParam },
							});
							return;
						}
						this._router.navigate(['/']);
					}
					// else {
					// 	if (redirectUrl) {
					// 		this._router.navigate([redirectUrl]);
					// 		return;
					// 	}
					// 	this._router.navigate(['/']);
					// }
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	// (empty)
	// ---------------------------------------------------//
	//                                                    //
	//                   ENTITY METHODS                   //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Replace current collection with the provided collection
	 * @param authTokens
	 */
	public setAuthTokens(authTokens: AuthToken[]) {
		this._store$$.update(setEntities(authTokens));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setAuthTokenProps(authTokenProps: Partial<AuthTokenProps>) {
		this._store$$.update(USER_PROPS_PIPES.updateAuthTokenProps(authTokenProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore({ name: storeName }, withEntities<AuthToken>(), USER_PROPS_PIPES.withAuthTokenProps());

		return store;
	}

	// ---------------------------------------------------//
	//                                                    //
	//                  CUSTOM METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	getCurrentAuthToken() {
		return this._store$$.getValue().authTokenProps.token;
	}
}
