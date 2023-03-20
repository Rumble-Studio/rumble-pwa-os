// import { Injectable } from '@angular/core';
// import { selectPersistStateInit } from '@datorama/akita';
// import { NotificationsService } from '@rumble-pwa/client-notifications';
// import { PlaylistItem } from '@rumble-pwa/mega-store';
// import { RestService } from '@rumble-pwa/requests';
// import { merge } from 'lodash';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { map, shareReplay, take, tap } from 'rxjs/operators';

// import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
// import {
// 	FavoriteObject,
// 	Profile,
// 	ProfileQuery,
// 	ProfileService,
// 	SessionQuery,
// 	SessionState,
// 	UserData,
// } from '@rumble-pwa/mega-store';

// @UntilDestroy()
// @Injectable({
// 	providedIn: 'root',
// })
// export class UsersRepository {
// 	profile$$: BehaviorSubject<Profile | undefined>;
// 	profile$: Observable<Profile | undefined>;
// 	favorites$$ = new BehaviorSubject<FavoriteObject[]>([]);
// 	favorites$ = this.favorites$$ as Observable<FavoriteObject[]>;
// 	favoritesAsPlaylistItems$$ = new BehaviorSubject<PlaylistItem[]>([]);

// 	constructor(
// 		private sessionQuery: SessionQuery,
// 		private restService: RestService,
// 		private profileService: ProfileService,
// 		private profileQuery: ProfileQuery,
// 		private notificationsService: NotificationsService
// 	) {
// 		this.profile$$ = this.profileQuery.profile$$;
// 		this.profile$ = this.profileQuery.profile$;

// 		selectPersistStateInit()
// 			.pipe(take(1))
// 			.subscribe(() => {
// 				// subscribe to session update from auth service
// 				this.sessionQuery.session$.subscribe((sessionState: SessionState) => {
// 					if (sessionState.token) {
// 						this.pullUserInfo();
// 					}
// 				});

// 				this.profile$.subscribe((profile) => {
// 					if (profile?.id && profile?.toSync !== false) {
// 						this.pushUserInfo(profile);
// 					}
// 				});
// 			});

// 		this.profile$$
// 			.pipe(
// 				untilDestroyed(this),
// 				tap(() => {
// 					this.updateFavoriteObjects();
// 				})
// 			)
// 			.subscribe();

// 		// create PlaylistItem[] from favorites to update favoritesPlaylistItems$$
// 	}

// 	pullUserInfo() {
// 		this.restService.get<Profile>('/users/me').subscribe((userServerData) => {
// 			this.profileService.update({
// 				...userServerData,
// 				operation: 'refresh',
// 			});
// 		});
// 	}

// 	pushUserInfo(userInfo: Partial<Profile>) {
// 		this.restService.put<Profile>(`/users/me`, userInfo).subscribe((userReturned) => {
// 			this.profileService.update({ ...userReturned, operation: 'refresh' });
// 		});
// 	}

// 	connectedUser$$.value?.id: string | undefined {
// 		return this.profile$$.getValue()?.id;
// 	}
// 	getUserId$() {
// 		return this.profile$$.pipe(map((profile) => profile?.id));
// 	}

// 	update(userInfo: Partial<Profile>) {
// 		this.profileService.update(userInfo);
// 	}

// 	addData(dataToAdd: UserData) {
// 		// console.log('You want to add this data', data);

// 		const defaultUserData: UserData = {};
// 		const profile = this.profile$$.getValue();
// 		const currentData: UserData = profile?.data ? JSON.parse(profile.data) : defaultUserData;

// 		const target: UserData = {};
// 		merge(target, currentData, dataToAdd);
// 		console.log('target', target);

// 		this.profileService.update({ data: JSON.stringify(target) });
// 	}

// 	// ----------------------------//
// 	//          FAVORITE           //
// 	// ----------------------------//

// 	updateFavoriteObjects() {
// 		const newFavoriteObjects = this.getFavoriteObjects();
// 		this.favorites$$.next(newFavoriteObjects);
// 	}

// 	toggleFavoriteObjectState(objectId: string, objectKind: FAVORITE_OBJECT_KINDS) {
// 		const now = new Date().getTime();
// 		const currentDataAsStr = this.profile$$.getValue()?.data;
// 		const currentData: UserData = currentDataAsStr ? JSON.parse(currentDataAsStr) : {};
// 		const favoritesFromData = currentData.favorites ?? [];

// 		let favoriteState = false;

// 		const favoriteFromData = favoritesFromData.find((favorite) => favorite.objectId === objectId);

// 		if (favoriteFromData) favoriteState = favoriteFromData.isFavorite;

// 		const newFavoriteObject: FavoriteObject = {
// 			objectId,
// 			objectKind,
// 			isFavorite: !favoriteState,
// 			lastEditDate: now,
// 		};

// 		if (!favoriteFromData) favoritesFromData.push(newFavoriteObject);
// 		else {
// 			const indexOfFavorite = favoritesFromData.indexOf(favoriteFromData);
// 			favoritesFromData[indexOfFavorite] = newFavoriteObject;
// 		}

// 		const newFavoriteObjects: UserData = {
// 			favorites: favoritesFromData,
// 		};

// 		this.addData(newFavoriteObjects);
// 	}

// }
