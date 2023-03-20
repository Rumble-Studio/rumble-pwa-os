// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { UsersRepository } from '@rumble-pwa/users/state';
// import { Observable } from 'rxjs';

// @Injectable({
// 	providedIn: 'root',
// })
// export class AuthGuard implements CanActivate {
// 	constructor(private _router: Router, private _usersRepository: UsersRepository) {}
// 	canActivate(
// 		route: ActivatedRouteSnapshot,
// 		state: RouterStateSnapshot
// 	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
// 		const isConnected = this._usersRepository.isConnected$$.getValue();
// 		if (isConnected) {
// 			return true;
// 		}
// 		this._router.navigate(['/auth/connexion'], {
// 			queryParams: { redirectUrl: encodeURI(state.url) },
// 		});
// 		return false;
// 	}
// }
