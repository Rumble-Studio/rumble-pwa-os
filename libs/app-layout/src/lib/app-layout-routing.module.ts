import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, Router, RouterModule } from '@angular/router';
import { CollectionPageComponent } from '@rumble-pwa/collections/pages';
import { User } from '@rumble-pwa/users/models';
import { ConnectedUserGuard } from '@rumble-pwa/users/state';
import { CatchAllPatchComponent } from './pages/catch-all-patch/catch-all-patch.component';
import { DashboardAnonymousComponent } from './pages/dashboard-anonymous/dashboard-anonymous.component';
import { DashboardGuestComponent } from './pages/dashboard-guest/dashboard-guest.component';
import { DashboardWelcomeComponent } from './pages/dashboard-welcome/dashboard-welcome.component';
import { DashboardWlComponent } from './pages/dashboard-wl/dashboard-wl.component';
import { HelpComponent } from './pages/help/help.component';
import { RoadmapComponent } from './pages/roadmap/roadmap.component';

const routesCnamed = [
	// {
	// 	path: 'welcome',
	// 	component: WelcomeComponent,
	// },
	// {
	// 	path: 'auth',
	// 	loadChildren: () => import('@rumble-pwa/auth-layout').then((m) => m.AuthLayoutModule),
	// },
	{
		path: '**',
		component: DashboardWlComponent,
	},
];

const routes: Route[] = [
	// {
	// 	path: 'welcome',
	// 	component: WelcomeComponent,
	// },
	{
		path: 'guest',
		component: DashboardGuestComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}
				return true;
			},
		},
	},
	{
		path: 'anonymous',
		component: DashboardAnonymousComponent,
		// canActivate: [AnonymousGuard], // you must be anonymous to access this page
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				if (!user.anonymous) {
					return router.parseUrl('/');
				}
				return true;
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
			},
		},
	},
	{
		path: 'dashboard',
		redirectTo: '',
	},
	{
		path: 'help',
		component: HelpComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}
				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
			},
		},
	},
	{
		path: 'roadmap',
		component: RoadmapComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}
				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;

				// console.log('[appLayoutRoutingModule](guard callback)'), user;
			},
		},
		children: [
			{
				path: '**',
				component: RoadmapComponent,
			},
		],
	},
	{
		path: '',
		component: DashboardWelcomeComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;

				// console.log('[appLayoutRoutingModule](guard callback)'), user;
			},
		},
	},
	{
		path: 'auth',
		loadChildren: () => import('@rumble-pwa/auth-layout').then((m) => m.AuthLayoutModule),
	},
	{
		// downloader
		path: 'files',
		loadChildren: () => import('@rumble-pwa/files/pages').then((m) => m.FilePagesModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}
				return true;

				// console.log('[appLayoutRoutingModule](guard callback)'), user;
			},
		},
	},
	{
		//  interviews
		path: 'forms',
		loadChildren: () => import('@rumble-pwa/forms-layout').then((m) => m.FormsLayoutModule),
		// canActivate: [AuthGuard],--> at the component level
	},
	{
		path: 'admin',
		loadChildren: () => import('@rumble-pwa/admin-panel-layout').then((m) => m.AdminPanelLayoutModule),
		// canActivate: [MultipleGuards],
		// data: {
		// 	guards: [SuperuserGuard, SupportuserGuard],
		// 	redirectTo: '/dashboard',
		// },
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (!user.isSuperuser) {
					return router.parseUrl('/');
				}
				return true;
			},
		},
	},
	{
		path: 'groups',
		loadChildren: () => import('@rumble-pwa/groups-layout').then((m) => m.GroupsLayoutModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'mixes',
		loadChildren: () => import('@rumble-pwa/mixes-layout').then((m) => m.MixesLayoutModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'items',
		loadChildren: () => import('@rumble-pwa/items/pages').then((m) => m.ItemsPageModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}
				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'collections/:collectionId/public',
		component: CollectionPageComponent,
		data: {
			publicPage: true,
		},
	},
	{
		path: 'collections',
		loadChildren: () => import('@rumble-pwa/collections/pages').then((m) => m.CollectionsPageModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'subscriptions',
		loadChildren: () => import('@rumble-pwa/subscriptions-layout').then((m) => m.SubscriptionsLayoutModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'billing',
		loadChildren: () => import('@rumble-pwa/billing-layout').then((m) => m.BillingLayoutModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'profile',
		loadChildren: () => import('@rumble-pwa/profile-layout').then((m) => m.ProfileLayoutModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'notifications',
		loadChildren: () => import('@rumble-pwa/notifications-layout').then((m) => m.NotificationsLayoutModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}
				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'notes',
		loadChildren: () => import('@rumble-pwa/notes-layout').then((m) => m.NotesLayoutModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'test',
		loadChildren: () => import('@rumble-pwa/playground').then((m) => m.PlaygroundModule),
	},
	{
		path: 'filetags',
		loadChildren: () => import('@rumble-pwa/filetags/pages').then((m) => m.FiletagsPagesModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'exports',
		loadChildren: () => import('@rumble-pwa/exports/pages').then((m) => m.ExportsPagesModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'brands',
		loadChildren: () => import('@rumble-pwa/brands/pages').then((m) => m.BrandsPageModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'domains',
		loadChildren: () => import('@rumble-pwa/domains/pages').then((m) => m.DomainsPagesModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: 'pages',
		loadChildren: () => import('@rumble-pwa/pages/pages').then((m) => m.PagesPagesModule),
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
		canActivate: [ConnectedUserGuard],
		data: {
			userCheckFn: (user: User, router: Router) => {
				// console.log('[appLayoutRoutingModule](guard callback)'), user;
				if (user.anonymous) {
					return router.parseUrl('/anonymous');
				}

				if (user.isGuestOnly) {
					return router.parseUrl('/guest');
				}
				return true;
			},
		},
	},
	{
		path: '**',
		// redirectTo: '',
		component: CatchAllPatchComponent,
	},
];

const cnamed = !(window.location.origin.includes('localhost') || window.location.origin.includes('app.rumble.studio'));
@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(cnamed ? routesCnamed : routes),
		//
	],
})
export class AppLayoutRoutingModule {}
