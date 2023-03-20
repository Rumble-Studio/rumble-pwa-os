import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// const routes: Routes = [
//   {
//     path: 'auth',
//     loadChildren: () =>
//       import('@rumble-pwa/auth-layout').then((m) => m.AuthLayoutModule),
//   },
//   {
//     path: '',
//     loadChildren: () =>
//       import('@rumble-pwa/app-layout').then((m) => m.AppLayoutModule),
//   },
// ];

// class CustomRouteReuseStrategy implements RouteReuseStrategy {
//   handlers: { [key: string]: DetachedRouteHandle } = {};

//   retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
//     if (!route.data['shouldReuse']) {
//       return {} as DetachedRouteHandle;
//     }
//     // console.log('%cRetrieving', 'color:pink', route.data['key']);
//     return this.handlers[route.data['key']];
//   }

//   store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
//     if (route.data['shouldReuse']) {
//       this.handlers[route.data['key']] = handle;
//       // console.log('%cStore', 'color:pink', route.data['key']);
//     }
//   }

//   shouldDetach(route: ActivatedRouteSnapshot): boolean {
//     return !!route.data['shouldReuse'];
//   }

//   shouldAttach(route: ActivatedRouteSnapshot): boolean {
//     return !!route.data['shouldReuse'] && !!this.handlers[route.data['key']];
//   }

//   shouldReuseRoute(
//     future: ActivatedRouteSnapshot,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     current: ActivatedRouteSnapshot
//   ): boolean {
//     return !!future.data['shouldReuse'];
//   }
// }

@NgModule({
	imports: [
		RouterModule.forRoot([]),
		// RouterModule.forRoot(routes, {
		//   preloadingStrategy: PreloadAllModules,
		//   // relativeLinkResolution: 'legacy',
		//   // enableTracing: true,
		// }),
	],
	// exports: [RouterModule],
	providers: [
		// {
		//   provide: RouteReuseStrategy,
		//   useClass: CustomRouteReuseStrategy,
		// },
	],
})
export class AppRoutingModule {}
