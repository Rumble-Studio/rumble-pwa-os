import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GroupsElementsModule } from '@rumble-pwa/groups-layout';
import { StorageModule } from '@rumble-pwa/storage';
import { AddGrantComponent } from './elements/add-grant/add-grant.component';
import { AddGroupChildComponent } from './elements/add-group-child/add-group-child.component';
import { AddGroupParentComponent } from './elements/add-group-parent/add-group-parent.component';
import { EditUserPromptComponent } from './elements/edit-user-prompt/edit-user-prompt.component';
import { GrantPromptComponent } from './elements/grant-prompt/grant-prompt.component';
import { GrantsListComponent } from './elements/grants-list/grants-list.component';
import { GroupPromptComponent } from './elements/group-prompt/group-prompt.component';
import { GroupsListComponent } from './elements/groups-list/groups-list.component';
import { OperationPromptComponent } from './elements/operation-prompt/operation-prompt.component';
import { OperationsListComponent } from './elements/operations-list/operations-list.component';
import { PermissionsListComponent } from './elements/permissions-list/permissions-list.component';
import { TasksListComponent } from './elements/tasks-list/tasks-list.component';
import { UsersListComponent } from './elements/users-list/users-list.component';
import { AdminPanelLayoutComponent } from './pages/admin-panel/admin-panel.component';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { ChangePlanPromptComponent } from './elements/change-plan-prompt/change-plan-prompt.component';

const routes = [
	{
		path: '',
		component: AdminPanelLayoutComponent,
	},
];
@NgModule({
	imports: [
		CommonModule,
		HttpClientModule,
		DesignSystemModule,
		RouterModule.forChild(routes),
		AkitaNgRouterStoreModule,
		StorageModule,
		GroupsElementsModule,
		ObjectListComponent,
		ObjectColumnComponent,
		GroupItemGenericComponent,
	],
	declarations: [
		UsersListComponent,
		AdminPanelLayoutComponent,
		TasksListComponent,
		GroupsListComponent,
		GroupPromptComponent,
		GrantPromptComponent,
		OperationsListComponent,
		PermissionsListComponent,
		OperationPromptComponent,
		GrantsListComponent,
		AddGroupParentComponent,
		AddGroupChildComponent,
		AddGrantComponent,
		EditUserPromptComponent,
		ChangePlanPromptComponent,
	],
	exports: [AdminPanelLayoutComponent, UsersListComponent, TasksListComponent],
})
export class AdminPanelLayoutModule {}
