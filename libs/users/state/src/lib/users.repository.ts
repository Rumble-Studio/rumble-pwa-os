import { Injectable } from '@angular/core';
import { createStore, propsFactory } from '@ngneat/elf';
import {
	addEntities,
	getAllEntities,
	getEntity,
	selectActiveEntities,
	selectActiveEntity,
	selectAllEntities,
	selectAllEntitiesApply,
	selectEntity,
	selectMany,
	setActiveId,
	setEntities,
	toggleActiveIds,
	UIEntitiesRef,
	updateEntities,
	upsertEntities,
	withActiveId,
	withActiveIds,
	withEntities,
	withUIEntities,
} from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { AuthTokensRepository } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { HubspotService } from '@rumble-pwa/monitoring-system';
import { ObjectAttribute, ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { GetToKnowYouQuestion, GET_TO_KNOW_YOU_QUESTIONS } from '@rumble-pwa/profile-system';
import { RestService } from '@rumble-pwa/requests';
import { FavoriteObject, FAVORITE_OBJECT_KINDS, User, UserData } from '@rumble-pwa/users/models';
import { Bss$$, prepEntityForCreation, prepEntityForRefresh, prepEntityForUpdate } from '@rumble-pwa/utils';
import { merge, sortBy, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

const storeName = 'users';
const storePropsName = 'userProps';

export interface UserUI {
	id: User['id'];
}
export interface UserProps {
	connectedUserId: null | string;
}

export const DEFAULT_USER_PROPS: UserProps = {
	connectedUserId: null,
};

export const USER_PROPS_PIPES = propsFactory(storePropsName, {
	initialValue: DEFAULT_USER_PROPS,
});

@Injectable({ providedIn: 'root' })
export class UsersRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public users$: Observable<User[]>;
	private _usersToSync$: Observable<User[]>;
	public userUIs$: Observable<UserUI[]>;
	public activeUsers$: Observable<User[]>;
	public activeUser$: Observable<User | undefined>;
	public userProps$: Observable<UserProps>;

	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	/** Connected user profile, only a proxy for userProps.connectedUser */
	public connectedUser$$ = new BehaviorSubject<User | null>(null);
	public connectedUserFavorite$$ = new BehaviorSubject<FavoriteObject[] | undefined>(undefined);

	/** True only if we have a connectedUser */
	_isConnected$$$ = new Bss$$<boolean>(false);
	public isConnected$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	/** Users where ownerId is logged-in user id (including deleted and archived) */
	public knownUsers$: Observable<User[]>;
	/** Users coming from a group (team/folder) or subfolders => used for display in pages (including deleted and archived) */
	public connectableUsers$: Observable<User[]>;
	/** Accessible users */
	public accessibleUsers$: Observable<User[]>;

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
		private _authTokensRepository: AuthTokensRepository,
		private _hubspotService: HubspotService,
		private _objectPromptService: ObjectPromptService
	) {
		// console.log('%c[UsersRepository](constructor)', 'color: #00a7e1; font-weight: bold');

		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.users$ = this._store$$.pipe(
			selectAllEntities(),
			tap(() => {
				console.log('%c[UsersRepository](constructor)', 'color: #55a7ff;', 'users$');
			}),
			shareReplay({ refCount: true })
		);
		this.userUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeUser$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeUsers$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.userProps$ = this._store$$.pipe(USER_PROPS_PIPES.selectUserProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		// this._persist.initialized$.pipe(take(1)).subscribe(() => {
		// 	this.fetchFromServer(true);
		// });

		// Instantiate usersToSyncs$
		this._usersToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);

		// Sync users
		this._usersToSync$.pipe(debounceTime(500)).subscribe((usersToSync) => {
			usersToSync.forEach((user) => {
				if (user?.operation === 'creation') {
					this._postToServer(user);
				} else if (user?.operation === 'update') this._putToServer(user);
			});
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// user that are owned by the connected user (TODO: filter more precisely like "guests" vs "co-team members")
		this.knownUsers$ = this.users$;
		// user you can connect as
		this.connectableUsers$ = of([]).pipe(shareReplay({ refCount: true }));

		// get accessible users (known and connectable)
		this.accessibleUsers$ = combineLatest([this.knownUsers$, this.connectableUsers$]).pipe(
			map(([ownedFiles, sharedFiles]) => {
				return sortBy(uniq([...ownedFiles, ...sharedFiles]), ['timeUpdate', 'timeCreation']).reverse();
			}),
			startWith([]),
			shareReplay({ refCount: true })
		);

		// convert userProp connectedUserId to connectedUser by
		// reading the store directly (to react to store update on connected user)
		this.userProps$
			.pipe(
				map((userProps) => userProps.connectedUserId),
				switchMap((connectedUserId) =>
					connectedUserId
						? this.get$(connectedUserId).pipe(map((connectedUserId) => connectedUserId ?? null))
						: of(null)
				)
			)
			.subscribe(this.connectedUser$$);

		// reacts to token update to get connected user data (contacts and profile info)
		this._authTokensRepository.authTokenProps$
			.pipe(map((authTokenProps) => authTokenProps.token))
			.pipe(
				tap((token) => {
					// console.log('[usersRepository] New token from authTokensRepo:', token);
					if (token) {
						// we have a token, hence we can request data
						this._fetchConnectedUser();
						this.fetchFromServer(true);
					} else {
						this.setUserProps({
							connectedUserId: null,
						});
					}
				})
			)
			.subscribe();

		// update isConnected$$ by filtering out same values
		this._isConnected$$$.$$.subscribe(this.isConnected$$);

		// get connected user to update favorites and logged in state favorite if user is connected, undefined if not
		this.connectedUser$$
			.pipe(
				tap((connectedUser) => {
					// console.log('%c[UsersRepository](constructor) Connected user:', 'color:green', connectedUser);

					// this._amplitudeService.updateUser(connectedUser);
					this._hubspotService.setProfile(connectedUser);

					if (!connectedUser) {
						this._isConnected$$$.value = false;
						// this.isConnected$$.next(false);
						this.connectedUserFavorite$$.next(undefined);
						return;
					}
					// this.isConnected$$.next(true);
					this._isConnected$$$.value = true;

					const defaultUserData: UserData = {};
					const currentData: UserData = connectedUser?.data ? JSON.parse(connectedUser?.data) : defaultUserData;
					const favoriteObjectsFromData: FavoriteObject[] = currentData.favorites ?? [];
					this.connectedUserFavorite$$.next(favoriteObjectsFromData.filter((favorite) => favorite.isFavorite));
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(user: User) {
		return this._restService
			.post<User | null>('/users', user)
			.pipe(
				tap((r) => {
					if (r) this._refreshUser(r);
				})
			)
			.subscribe();
	}

	private _putToServer(user: User) {
		return this._restService
			.put<User | null>(`/users/${user.id}`, user)
			.pipe(
				tap((r) => {
					if (r) this._refreshUser(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<User[]>('/users')
			.pipe(
				tap((users) => {
					if (replace) {
						this._store$$.update(upsertEntities(users));
					} else {
						users.forEach((user) => {
							this._refreshUser(user);
						});
					}
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   ENTITY METHODS                   //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Replace current collection with the provided collection
	 * @param users
	 */
	public setUsers(users: User[]) {
		this._store$$.update(setEntities(users));
	}

	/**
	 * Add a new user to the collection
	 * @param user
	 */
	public addUser(user: User) {
		const syncableUser = prepEntityForCreation<User>(user);
		this._store$$.update(addEntities(syncableUser));
	}

	/**
	 * Update an existing user in the collection
	 * @param id
	 * @param userUpdate (partial)
	 */
	public updateUser(id: User['id'] | undefined, userUpdate: Partial<User>) {
		const idToUse = id ?? userUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update user without an id');
		}

		const previousUser = this._store$$.query(getEntity(idToUse));
		if (!previousUser) {
			throw new Error(`User with id ${idToUse} not found`);
		}
		const updatedUser: User = {
			...previousUser,
			...userUpdate,
		};
		const syncableUser = prepEntityForUpdate<User>(updatedUser, previousUser);
		this._store$$.update(updateEntities(idToUse, syncableUser));
	}

	/**
	 * Upsert an entity (creates it if missing) respecting elfSyncable concept
	 * @param user
	 */
	public upsertUser(user: User) {
		const previousUser = this._store$$.query(getEntity(user.id));
		if (previousUser) {
			this.updateUser(user.id, user);
		} else {
			this.addUser(user);
		}
	}

	private _refreshUser(user: User) {
		const previousUser = this._store$$.query(getEntity(user.id));
		const syncableUser = prepEntityForRefresh<User>(user, previousUser);
		this._store$$.update(upsertEntities([syncableUser]));
	}

	/**
	 * Subscribe to a user
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<User | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string): User | undefined {
		return this._store$$.query(getEntity(id));
	}

	public getAll(): User[] {
		return this._store$$.query(getAllEntities());
	}

	public selectManyByIds$(userIds: string[]): Observable<User[]> {
		return this._store$$.pipe(selectMany(userIds));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	public setActiveId(id: User['id']) {
		this._store$$.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<User['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setUserProps(userProps: Partial<UserProps>) {
		this._store$$.update(USER_PROPS_PIPES.updateUserProps(userProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<User>(),
			withUIEntities<UserUI>(),
			USER_PROPS_PIPES.withUserProps(),
			withActiveId(),
			withActiveIds()
		);

		return store;
	}

	// ---------------------------------------------------//
	//                                                    //
	//                  CUSTOM METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * convert user to a profile picture URL (can starts with `rs://`)
	 * @param user
	 * @returns
	 */
	public getUserAvatar(user?: User | null) {
		const defaultUserData: UserData = {};
		const userData: UserData = user?.data ? JSON.parse(user.data) : defaultUserData;
		return userData.profilePictureUrl ?? '/assets/avatar.png';
	}

	/**
	 * Update the data of a specific user
	 * @param userId
	 * @param dataToAdd
	 * @returns
	 */
	public addDataToUser(userId: string, dataToAdd: Partial<UserData>) {
		// console.log('You want to add this data', data);

		const user = this.get(userId);
		if (!user) return;
		const defaultUserData: UserData = {};
		const currentData: UserData = user?.data ? JSON.parse(user.data) : defaultUserData;
		const target: UserData = {};
		merge(target, currentData, dataToAdd);
		this.updateUser(userId, { data: JSON.stringify(target) });
	}

	/**
	 * Update the data of a specific user
	 * @param dataToAdd
	 */
	public addDataToConnectedUser(dataToAdd: Partial<UserData>) {
		const connectedUserId = this.connectedUser$$.getValue()?.id;
		if (!connectedUserId) return;
		this.addDataToUser(connectedUserId, dataToAdd);
	}

	/**
	 * Update the connected user (like `updateUser` but automatically fill the `userId`)
	 * @param userUpdate
	 * @returns
	 */
	updateConnectedUser(userUpdate: Partial<User>) {
		const connectedUserId = this.connectedUser$$.getValue()?.id;
		if (!connectedUserId) return;
		this.updateUser(connectedUserId, userUpdate);
	}

	/**
	 * Request a verify-email email
	 * @param userEmail
	 * @param redirectUrl
	 */
	public sendEmailValidation(userEmail?: string, redirectUrl?: string) {
		const userEmailToUse = userEmail ?? this.connectedUser$$.getValue()?.email;
		this._restService.post('/users/verify-email/request', { userEmailToUse, redirectUrl }).subscribe(() => {
			this._notificationsService.success(
				'An email has been sent to your email address ' + userEmailToUse + '.',
				'Email send'
			);
		});
	}

	// 	updateNewTou(acceptNewCgu: boolean) {
	// 		this.restService.post<Profile>('/users/accept-tou', acceptNewCgu).subscribe((updatedUser) => {
	// 			this.notificationsService.success('New TOU accepted.', 'Success');
	// 			this.profileService.update({ ...updatedUser, operation: 'refresh' });
	// 		});
	// 	}

	changePassword(userPassword: string, oldPassword?: string) {
		this._restService
			.post<User>('/users/change-password', {
				new_password: userPassword,
				old_password: oldPassword,
			})
			.subscribe(
				(user) => {
					this._notificationsService.success('Password changed.', 'Success');
					this.updateUser(user.id, user);
				},
				(error) => {
					this._notificationsService.error(
						`Error while changing your password: ${error?.error.detail}`,
						'Error',
						error
					);
				}
			);
	}

	// 	passwordReset(userPassword: string, oldPassword: string) {
	// 		console.warn('not implemented yet', { userPassword, oldPassword });
	// 	}

	/**
	 * Request an email to change the email
	 * @param newEmail
	 */
	changeConnectedUserEmail(newEmail: string) {
		this._restService.post('/users/change-email/request', newEmail).subscribe(
			() => {
				this._notificationsService.success('Please check your new mailbox.', 'Email send');
			},
			(error) => {
				this._notificationsService.error(`Unexpected error: ${error?.error.detail}`, 'Error', error);
			}
		);
	}

	isObjectFavorite(objectId?: string, objectKind?: FAVORITE_OBJECT_KINDS): boolean {
		const connectedUser = this.connectedUser$$.value;
		if (!connectedUser || !objectId || !objectKind) return false;
		const defaultUserData: UserData = {};
		const currentData: UserData = connectedUser?.data ? JSON.parse(connectedUser.data) : defaultUserData;
		if (!currentData.favorites) {
			return false;
		}
		const favoritesFromData = currentData.favorites.find(
			(favorite) => favorite.objectId === objectId && favorite.objectKind === objectKind
		);
		if (!favoritesFromData) return false;

		return favoritesFromData.isFavorite;
	}

	isObjectFavorite$(objectId?: string, objectKind?: FAVORITE_OBJECT_KINDS): Observable<boolean> {
		return this.connectedUserFavorite$$.pipe(
			map(() => {
				return this.isObjectFavorite(objectId, objectKind);
			})
		);
	}

	/**
	 * Toggle the state of a favorite for the connected if user is connected
	 * @param objectId
	 * @param objectKind
	 * @returns the new state or undefined if not connected
	 */
	toggleFavoriteObjectState(objectId?: string, objectKind?: FAVORITE_OBJECT_KINDS): undefined | boolean {
		const connectedUser = this.connectedUser$$.value;
		if (!connectedUser || !objectId || !objectKind) return undefined;
		const defaultUserData: UserData = {};
		const currentData: UserData = connectedUser?.data ? JSON.parse(connectedUser.data) : defaultUserData;

		// all favorites
		const favoritesFromData = currentData.favorites ?? [];
		// the favorite to toggle
		const favoriteFromData = favoritesFromData.find((favorite) => favorite.objectId === objectId);
		const favoriteState = favoriteFromData?.isFavorite ?? false;
		const now = new Date().getTime();
		const newFavoriteObject: FavoriteObject = {
			objectId,
			objectKind,
			isFavorite: !favoriteState,
			lastEditDate: now,
		};

		if (!favoriteFromData) favoritesFromData.push(newFavoriteObject);
		else {
			const indexOfFavorite = favoritesFromData.indexOf(favoriteFromData);
			favoritesFromData[indexOfFavorite] = newFavoriteObject;
		}

		this.addDataToConnectedUser({
			favorites: favoritesFromData,
		});
		return newFavoriteObject.isFavorite;
	}

	private _fetchConnectedUser() {
		this._restService.get<User>('/users/me').subscribe((userServerData) => {
			this.setUserProps({
				connectedUserId: userServerData.id,
			});
			this._refreshUser(userServerData);
		});
	}

	///////////////////////////////////////////////
	//                                           //
	//                    KYC                    //
	//                                           //
	///////////////////////////////////////////////

	private _getGetToKnowYouQuestionsLeft(update: boolean = false) {
		const questionsLeft: GetToKnowYouQuestion[] = [];
		const answers: UserData = {};

		const profile = this.connectedUser$$.getValue();
		if (!profile) return { questionsLeft, answers };
		const defaultProfileData: UserData = {};
		const profileData = profile?.data ? JSON.parse(profile.data) : defaultProfileData;
		if (!profileData) return { questionsLeft, answers };
		GET_TO_KNOW_YOU_QUESTIONS.forEach((question) => {
			if (!Object.keys(profileData).includes(question.questionId)) {
				// question not in data => we add it
				questionsLeft.push(question);
			} else {
				// question is in data
				const answer = profileData[question.questionId];
				answers[question.questionId] = answer;
				if (!answer || update) {
					// we have no answer (or we want to update anyway) => we add it
					questionsLeft.push(question);
				}
			}
		});
		return { questionsLeft, answers };
	}

	public getObjectDetailsKYC(update: boolean = false) {
		const { questionsLeft, answers } = this._getGetToKnowYouQuestionsLeft(update);

		return {
			modalTitle: 'Quick survey',
			modalCancelText: 'Later',
			modalDescription:
				questionsLeft.length +
				' question' +
				(questionsLeft.length > 1 ? 's ' : ' ') +
				'no more, to improve your experience.',
			modalSubmitText: 'Save',
			object: answers,
			attributes: questionsLeft.map((q) => {
				const objAttr: ObjectAttribute<UserData> = {
					name: q.questionId,
					HTMLlabel: q.question,
					attributeType: q.kind,
					multiple: q.multiple,
					extra: {
						options: q.possibleChoices.map((pc) => {
							return {
								name: pc.displayValue,
								value: pc.id,
							};
						}),
					},
				};
				return objAttr;
			}),
		};
	}

	public launchKYCForm(update: boolean = false) {
		const objectDetailsKYC = this.getObjectDetailsKYC(update);
		this._objectPromptService
			.openObjectPromptModal$<UserData>(objectDetailsKYC)
			.pipe(
				map((result) => {
					if (!result) return;
					this.addDataToConnectedUser(result);
				})
			)
			.subscribe();
	}
}
