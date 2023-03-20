import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { AuthDialogService } from './auth-dialog.service';
import { AuthDialogComponent } from './elements/auth-dialog/auth-dialog.component';
import { ProConnexionFormComponent } from './elements/pro-connexion-form/pro-connexion-form.component';
import { ProLoginFormComponent } from './elements/pro-login-form/pro-login-form.component';
import { ProMessageComponent } from './elements/pro-message/pro-message.component';
import { ProRegisterFormComponent } from './elements/pro-register-form/pro-register-form.component';
import { ProResetFormComponent } from './elements/pro-reset-form/pro-reset-form.component';
import { TouComponent } from './elements/tou/tou.component';
import { ProConnexionPageComponent } from './pages/pro-connexion-page/pro-connexion-page.component';
import { InfoComponent } from './pages/info/info.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { ProResetPageComponent } from './pages/pro-reset-page/pro-reset-page.component';
import { TouPageComponent } from './pages/tou-page/tou-page.component';
import { VerifyEmailClaimComponent } from './pages/verify-email-claim/verify-email-claim.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';

const routes = [
	{
		path: 'connexion',
		component: ProConnexionPageComponent,
	},
	{
		path: 'logout',
		component: LogoutComponent,
	},
	{
		path: 'password-forgotten',
		component: ProResetPageComponent,
	},
	{
		path: 'info',
		component: InfoComponent,
	},
	{
		path: 'tou',
		component: TouPageComponent,
	},
	{
		path: 'email-verified',
		component: VerifyEmailClaimComponent,
	},
	{
		path: 'verify-email',
		component: VerifyEmailComponent,
	},
	{
		path: '**',
		redirectTo: 'register',
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
	],
	declarations: [
		AuthDialogComponent,
		LogoutComponent,
		InfoComponent,
		ProLoginFormComponent,
		ProRegisterFormComponent,
		// ProLoginPageComponent,
		// ProRegisterPageComponent,
		ProResetFormComponent,
		ProResetPageComponent,
		ProMessageComponent,
		TouComponent,
		TouPageComponent,
		VerifyEmailClaimComponent,
		ProConnexionPageComponent,
		ProConnexionFormComponent,
		VerifyEmailComponent,
	],
	providers: [AuthDialogService],
})
export class AuthLayoutModule {}
