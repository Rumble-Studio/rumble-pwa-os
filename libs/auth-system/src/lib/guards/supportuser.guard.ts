// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { selectPersistStateInit } from '@datorama/akita';
// import { GrantsQuery } from '@rumble-pwa/mega-store';
// import { combineLatest, Observable } from 'rxjs';
// import { map, take } from 'rxjs/operators';
// import { AuthService } from '../auth.service';

// @Injectable({
// 	providedIn: 'root',
// })
// export class SupportuserGuard implements CanActivate {
// 	constructor(private router: Router, private authService: AuthService, private _grantsQuery: GrantsQuery) {}
// 	canActivate(
// 		route: ActivatedRouteSnapshot,
// 		state: RouterStateSnapshot,
// 		redirect = true
// 	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
// 		return combineLatest([
// 			this._usersRepository.isConnected$$,
// 			this._grantsQuery.grants$$,
// 			selectPersistStateInit().pipe(take(1)),
// 		]).pipe(
// 			map(([isLoggedIn, grants]) => {
// 				const isSupportUser = grants.some(
// 					(grant) => grant.permissionId === 'is-support-user' && grant.state === 'default'
// 				);
// 				if (isLoggedIn && isSupportUser) return true;
// 				if (redirect)
// 					this.router.navigate(['/dashboard'], {
// 						queryParams: { redirectUrl: state.url },
// 					});

// 				return false;
// 			}),
// 			take(1)
// 		);
// 	}
// }
