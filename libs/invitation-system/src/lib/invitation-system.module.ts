import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamInvitationClaimComponent } from './pages/team-invitation-claim/team-invitation-claim.component';
import { RouterModule } from '@angular/router';

const routes = [
	{
		path: 'claim/:token',
		component: TeamInvitationClaimComponent,
	},
	// {
	//   path: '**',
	//   redirectTo: 'auth',
	//   //component: TeamInvitationClaimComponent,
	// },
];

@NgModule({
	imports: [CommonModule, RouterModule.forChild(routes)],
	declarations: [TeamInvitationClaimComponent],
})
export class InvitationSystemModule {}
