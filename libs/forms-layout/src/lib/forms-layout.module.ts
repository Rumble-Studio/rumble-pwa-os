import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ExplanationComponent, ResizableModule } from '@rumble-pwa/atomic-system';
import { AuthDialogService } from '@rumble-pwa/auth-layout';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FormListComponent } from '@rumble-pwa/forms/ui';
import { GroupsElementsModule } from '@rumble-pwa/groups-layout';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { scopeLoader } from '@rumble-pwa/i18n';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { TodoComponent, TodoOpenComponent } from '@rumble-pwa/todo';
import { UpgradeComponent } from '@rumble-pwa/upgrade/ui';
import { User } from '@rumble-pwa/users/models';
import { ConnectedUserGuard } from '@rumble-pwa/users/state';
import { GenericFavoriteComponent } from '@rumble-pwa/users/ui';
import { UtilsModule } from '@rumble-pwa/utils';
import { FormEditorDadComponent } from './elements/form-editor-dad/form-editor-dad.component';
import { RecordingSessionCanvasComponent } from './elements/recording-session-canvas/recording-session-canvas.component';
import { FormsElementsModule } from './forms-elements.module';
import { FormListPageComponent } from './pages/form-list-page/form-list-page.component';
import { FormOpenerComponent } from './pages/form-opener/form-opener.component';
import { StepEditorPageComponent } from './pages/step-editor-page/step-editor-page.component';

const routes = [
	{
		// list of all forms
		path: '',
		component: FormListPageComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
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
		// form opener, for guest to consume an interview
		path: 'open/:formId',
		component: FormOpenerComponent,
		// NO GUARDS => full access to everyone
	},
	{
		path: 'editor/:formId',
		component: FormEditorDadComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
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
		path: 'stepEditor/:stepId',
		component: StepEditorPageComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
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
		path: 'canvas/:formId',
		component: RecordingSessionCanvasComponent,
		// canActivate: [AuthGuard, NotAnonymousGuard, EmailVerifiedGuard, NotGuestOnlyGuard],
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
		path: '**',
		redirectTo: '',
	},
];
@NgModule({
	imports: [
		CommonModule,
		DesignSystemModule,
		GroupsElementsModule, // sharing with groups in forms
		RouterModule.forChild(routes),
		UtilsModule,
		FormsElementsModule,
		TodoComponent,
		TodoOpenComponent,
		GroupItemGenericComponent,
		ExplanationComponent,
		ResizableModule,
		GenericFavoriteComponent,
		FormListComponent,
		TrackClickDirective,
		UpgradeComponent,
		TranslocoModule,
	],
	declarations: [
		//
		FormOpenerComponent,
		FormEditorDadComponent,
		FormListPageComponent,
		StepEditorPageComponent,
	],
	exports: [],
	providers: [
		AuthDialogService,
		{
			provide: TRANSLOCO_SCOPE,
			useValue: {
				// this 2 lines are basically
				// saying "please load the json file into ABC namespace."
				// HTML will need to use at least "profileLayout." to use its content.
				scope: 'formsLayout',
				loader: scopeLoader((lang: string) => {
					console.log('[FormsLayoutModule](scopeLoader)', lang);
					return import(`./i18n/${lang}.json`);
				}),
			},
		},
	],
})
export class FormsLayoutModule {}
