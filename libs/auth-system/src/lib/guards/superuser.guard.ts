// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { UsersRepository } from '@rumble-pwa/users/state';
// import { Observable } from 'rxjs';

// @Injectable({
// 	providedIn: 'root',
// })
// export class SuperuserGuard implements CanActivate {
// 	constructor(private router: Router, private _usersRepository: UsersRepository) {}
// 	canActivate(
// 		route: ActivatedRouteSnapshot,
// 		state: RouterStateSnapshot,
// 		redirect = true
// 	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
// 		if (this._usersRepository.connectedUser$$.getValue()?.isSuperuser) return true;
// 		if (redirect)
// 			this.router.navigate(['/dashboard'], {
// 				queryParams: { redirectUrl: state.url },
// 			});

// 		return false;
// 	}
// }
