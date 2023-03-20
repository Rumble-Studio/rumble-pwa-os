// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { selectPersistStateInit } from '@datorama/akita';
// import { NotificationsService } from '@rumble-pwa/client-notifications';
// import { UsersRepository } from '@rumble-pwa/users/state';
// import { combineLatest, Observable } from 'rxjs';
// import { map, take } from 'rxjs/operators';

// /**
//  * This guard is to only allow ANONYMOUS to access the endpoint
//  * You must be connected AND anonymous
//  */
// @Injectable({
// 	providedIn: 'root',
// })
// export class AnonymousGuard implements CanActivate {
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
// 				// console.log('%c[AnonymousGuard] (1)', 'color:purple', user, route, state.url);
// 				if (user?.anonymous) {
// 					return true;
// 				}
// 				// console.log('%c[AnonymousGuard] (2) not anonymous: returning false', 'color:purple', user, route, state.url);
// 				this._notificationsService.info('This page is restricted to anonymous users.');
// 				// this.router.navigate(['/']);
// 				// console.log('[AnonymousGuard] redirect to /');
// 				return false;
// 			}),
// 			take(1)
// 		);
// 	}
// }
