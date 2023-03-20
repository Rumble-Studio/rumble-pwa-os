// import { Injectable } from '@angular/core';
// import { RestService } from '@rumble-pwa/requests';
// import { debounceTime, switchMap, take, tap } from 'rxjs/operators';
// import { AuthService } from '@rumble-pwa/auth-system';
// import { selectPersistStateInit } from '@datorama/akita';
// import { BehaviorSubject, of } from 'rxjs';
// import { User, UserData, UsersQuery, UsersService } from '@rumble-pwa/mega-store';

// @Injectable({
// 	providedIn: 'root',
// })
// export class UsersRepository {
// 	users$$: BehaviorSubject<User[]>;

// 	constructor(
// 		private restService: RestService,
// 		private usersService: UsersService,
// 		private usersQuery: UsersQuery,
// 		private authService: AuthService
// 	) {
// 		this.users$$ = this.usersQuery.users$$;

// 		selectPersistStateInit()
// 			.pipe(take(1))
// 			.subscribe(() => {
// 				this.pullData();
// 				this.pushData();
// 			});
// 	}

// 	pullData() {
// 		// get users data from server (if isloggedIn)
// 		this._usersRepository.isConnected$$
// 			.pipe(
// 				switchMap((isLoggedIn) => {
// 					if (isLoggedIn) {
// 						return this.restService.get<User[]>('/users');
// 					}
// 					return of([] as User[]);
// 				}),
// 				tap((userApis) => {
// 					// upsert users to local store
// 					this.usersService.upsertMany(
// 						userApis.map((userApis) => {
// 							return { ...userApis, operation: 'refresh' };
// 						})
// 					);
// 				})
// 			)
// 			.subscribe();
// 	}

// 	pullDataOnce(callback?: () => void) {
// 		// get users data from server (if isloggedIn)
// 		this._usersRepository.isConnected$$
// 			.pipe(
// 				take(1), // only once
// 				switchMap((isLoggedIn) => {
// 					if (isLoggedIn) {
// 						return this.restService.get<User[]>('/users');
// 					}
// 					return of([] as User[]);
// 				}),
// 				tap((userApis) => {
// 					// upsert users to local store
// 					this.usersService.upsertMany(
// 						userApis.map((userApis) => {
// 							return { ...userApis, operation: 'refresh' };
// 						})
// 					);
// 				})
// 			)
// 			.subscribe();
// 	}

// 	pushData() {
// 		this.usersQuery.usersToSync$.pipe(debounceTime(1000)).subscribe((users) => {
// 			users.forEach((user) => {
// 				if (user?.operation === 'creation') {
// 					this._postToServer(user);
// 				} else if (user?.operation === 'update') {
// 					this._putToServer(user);
// 				}
// 			});
// 		});
// 	}

// 	//
// 	// SERVER SYNC
// 	//
// 	private _putToServer(user: User) {
// 		return this.restService
// 			.put<User>('/users/' + user.id, user)
// 			.pipe(
// 				tap((r) => {
// 					this.usersService.upsert({ ...r, operation: 'refresh' });
// 				})
// 			)
// 			.subscribe();
// 	}
// 	private _postToServer(user: User) {
// 		const updatedUser: User = user;
// 		return this.restService
// 			.post<User>('/users', updatedUser)
// 			.pipe(
// 				tap((r) => {
// 					// console.log('post result is:', r);
// 					this.usersService.upsert({ ...r, operation: 'refresh' });
// 				})
// 			)
// 			.subscribe();
// 	}

// 	public update(id: string, data: Partial<User>) {
// 		this.usersService.update(id, data);
// 	}

// 	public removeFromStore(id: string) {
// 		this.usersService.remove(id);
// 	}

// 	public getUsersAsAdmin$() {
// 		return this.restService.get<User[]>('/users/as-admin');
// 	}

// 	public get(id: string) {
// 		return this.usersQuery.getEntity(id);
// 	}
// 	public get$(id: string) {
// 		return this.usersQuery.selectEntity(id);
// 	}

// 	public getAll$() {
// 		return this.usersQuery.selectAll({
// 			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
// 		});
// 	}

// 	getByEmail(email: string) {
// 		return this.usersQuery.getEntity({
// 			filterBy: (user: User) => user.email === email,
// 		});
// 	}

// 	getUserData(user: User): UserData {
// 		const dataAsStr = user?.data;
// 		if (dataAsStr) {
// 			const data = JSON.parse(dataAsStr);
// 			return data;
// 		}
// 		return {};
// 	}
// 	/**
// 	 * convert user to a profile picture URL (can starts with `rs://`)
// 	 * @param user
// 	 * @returns
// 	 */
// 	public getUserAvatar(user?: User) {
// 		const defaultUserData: UserData = {};
// 		const userData: UserData = user?.data ? JSON.parse(user.data) : defaultUserData;
// 		return userData.profilePictureUrl ?? '/assets/avatar.png';
// 	}
// }
