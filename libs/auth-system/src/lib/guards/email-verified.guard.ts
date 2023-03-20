// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { selectPersistStateInit } from '@datorama/akita';
// import { NotificationsService } from '@rumble-pwa/client-notifications';
// import { UsersRepository } from '@rumble-pwa/users/state';
// import { combineLatest, Observable } from 'rxjs';
// import { filter, map, take } from 'rxjs/operators';
// @Injectable({
// 	providedIn: 'root',
// })
// export class EmailVerifiedGuard implements CanActivate {
// 	constructor(
// 		private router: Router,
// 		private _usersRepository: UsersRepository,
// 		private _notificationsService: NotificationsService
// 	) {}

// 	canActivate(
// 		route: ActivatedRouteSnapshot,
// 		state: RouterStateSnapshot
// 	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
// 		return true;
// 		// return combineLatest([this._usersRepository.profile$, selectPersistStateInit().pipe(take(1))]).pipe(
// 		// 	// filter(([user]) => !!user),
// 		// 	map(([user]) => {
// 		// 		// console.log('[AnonymousGuard] redirect to /');
// 		// 		console.log('%c[EmailVerifiedGuard] (1)', 'color:purple', user, route, state.url);
// 		// 		if (user?.emailValidated) return true;
// 		// 		console.log(
// 		// 			'%c[EmailVerifiedGuard] (2) email not validated: redirec tto verify-email and return false',
// 		// 			'color:purple',
// 		// 			user,
// 		// 			route,
// 		// 			state.url
// 		// 		);
// 		// 		this.router.navigate(['/auth/verify-email']);
// 		// 		return false;
// 		// 	}),
// 		// 	take(1)
// 		// );
// 	}
// }
