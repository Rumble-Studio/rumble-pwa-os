// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { Injectable, Injector } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { from, Observable, of } from 'rxjs';
// import { concatMap, first, tap } from 'rxjs/operators';

// /**
//  * THIS GUARD IS USED TO CHECK MULTIPLE GUARD AND RETURN TRUE IF ONE RETURNS TRUE
//  * IT'S AN 'OR' GUARD[]
//  */

// @Injectable({
// 	providedIn: 'root',
// })
// export class MultipleGuards implements CanActivate {
// 	constructor(public injector: Injector, private router: Router) {}

// 	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
// 		return from(route.data.guards).pipe(
// 			// We check every result of guard.canActivate()
// 			concatMap((value) => {
// 				const guard = this.injector.get(value);
// 				const result = guard.canActivate(route, state, false);
// 				if (result instanceof Observable) {
// 					return result;
// 				} else if (result instanceof Promise) {
// 					return from(result);
// 				} else {
// 					return of(result);
// 				}
// 			}),
// 			// As it's an OR operator, we return true once one guard returns true
// 			first((x) => x === true || x instanceof UrlTree, false),
// 			tap((x) => {
// 				// If no guard returns true, then we redirect
// 				if (!x) {
// 					const redirectTo = route.data.redirectTo ?? '/dashboard';
// 					this.router.navigate([redirectTo], {
// 						queryParams: { redirectUrl: state.url },
// 					});
// 				}
// 			})
// 		);
// 	}
// }
