import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UsersRepository } from '../users.repository';

@Injectable({
	providedIn: 'root',
})
export class ConnectedUserGuard implements CanActivate {
	constructor(private _router: Router, private _usersRepository: UsersRepository) {}
	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		// console.log('%c[ConnectedUserGuard](canActivate)', 'color:blue', 'route:', route, state);

		const currentQueryParams = route.queryParams;
		const isConnected = this._usersRepository.isConnected$$.getValue();
		if (isConnected) {
			const userCheckFn = route.data['userCheckFn'];
			if (userCheckFn) {
				// console.log('%c[ConnectedUserGuard](canActivate)', 'color:blue', 'route:', route.routeConfig?.path);

				const connectedUser = this._usersRepository.connectedUser$$.getValue();
				if (connectedUser) return userCheckFn(connectedUser, this._router) ?? true;
				console.warn('User is connected but not available.');
				return false;
			}

			return true;
		}
		console.log('%c[ConnectedUserGuard](canActivate)', 'color:blue', 'Not connected yet');

		this._router.navigate(['/auth/connexion'], {
			queryParams: { redirectUrl: encodeURI(state.url), ...currentQueryParams },
		});
		return false;
	}
}
