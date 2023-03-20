import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTreeModule } from '@angular/material/tree';
import { RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GroupItemFileComponent, GroupItemGenericComponent, GroupItemUserComponent } from '@rumble-pwa/groups/ui';
import { GrantItemGenericComponent } from './elements/grant-item-generic/grant-item-generic.component';
import { GroupItemComponent } from './elements/group-item/group-item.component';
import { GroupTableComponent } from './elements/group-table/group-table.component';
import { InviteMemberPromptComponent } from './elements/invite-member-prompt/invite-member-prompt.component';
import { GroupsElementsModule } from './groups-elements.module';
import { GroupListPageComponent } from './pages/group-list/group-list-page.component';
import { GroupViewerComponent } from './pages/group-viewer/group-viewer.component';
const routes = [
	{
		path: '',
		component: GroupListPageComponent,
	},
	{
		path: ':groupId',
		component: GroupViewerComponent,
	},
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
		MatTreeModule,
		CdkTreeModule,
		GroupsElementsModule,
		//
		GroupItemGenericComponent,
		GroupItemUserComponent,
		GroupItemFileComponent,
		TrackClickDirective,
	],
	declarations: [
		GroupListPageComponent,
		GroupViewerComponent,
		GroupItemComponent,
		GroupTableComponent,
		InviteMemberPromptComponent,
		GrantItemGenericComponent,
	],
})
export class GroupsLayoutModule {}
