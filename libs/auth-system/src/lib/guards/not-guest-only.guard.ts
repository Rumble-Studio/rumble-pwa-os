// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { selectPersistStateInit } from '@datorama/akita';
// import { NotificationsService } from '@rumble-pwa/client-notifications';
// import { UsersRepository } from '@rumble-pwa/users/state';
// import { combineLatest, Observable } from 'rxjs';
// import { filter, map, take } from 'rxjs/operators';

// /**
//  * This router is to prevent Guest to access the endpoint
//  * But you must be logged
//  */
// @Injectable({
// 	providedIn: 'root',
// })
// export class NotGuestOnlyGuard implements CanActivate {
// 	constructor(
// 		private router: Router,
// 		private _usersRepository: UsersRepository,
// 		private _notificationsService: NotificationsService
// 	) {}

// 	canActivate(
// 		route: ActivatedRouteSnapshot,
// 		state: RouterStateSnapshot
// 	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
// 		return combineLatest([this._usersRepository.connectedUser$$, selectPersistStateInit().pipe(take(1))]).pipe(
// 			map(([user]) => {
// 				// console.log('%c[NotGuestOnlyGuard] (1)', 'color:purple', user, route, state.url);
// 				if (!user?.isGuestOnly) {
// 					return true;
// 				}
// 				// console.log('%c[NotGuestOnlyGuard] (2) not anonymous: returning false', 'color:purple', user, route, state.url);
// 				// this._notificationsService.info('This page is restricted to creator users.');
// 				this.router.navigate(['/guest']);
// 				return false;
// 			}),
// 			take(1)
// 		);
// 	}
// }
