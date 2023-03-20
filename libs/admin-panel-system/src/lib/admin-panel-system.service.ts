import { Injectable } from '@angular/core';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GrantsManagementService, PermissionService, PermissionsManagementService } from '@rumble-pwa/groups-system';
import { Grant, Subscription } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { TasksManagementService } from '@rumble-pwa/tasks-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { User } from '@rumble-pwa/users/models';
import { take } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
	providedIn: 'root',
})
export class AdminPanelSystemService {
	// Endpoints

	constructor(
		private _restService: RestService,
		private _usersRepository: UsersRepository,
		private _tasksManagementService: TasksManagementService,
		private notificationsService: NotificationsService,
		private _grantsManagementService: GrantsManagementService,
		private _authService: AuthService,
		private _permissionsManagementService: PermissionsManagementService,
		private _permissionService: PermissionService
	) {}

	// public onManualValidation(id: string) {
	// 	this._usersRepository.updateUser(id, { emailValidated: true });
	// }

	// public sendValidationEmailEmail(email: string) {
	// 	this._restService.post('/users/verify-email/request', email).subscribe(() => {
	// 		this.notificationsService.success('An email has been sent to ' + email, 'Email send');
	// 	});
	// }

	// public onRefreshUser() {
	// 	this._usersRepository.fetchFromServer();
	// }

	public onRefreshTask() {
		console.warn('Refreshing task Not implemented');
		// this._tasksManagementService.pullDataOnce();
		// console.log('Tasks lists has been refreshed');
	}

	public onReloadTask(id: string) {
		this._restService
			.get('/tasks/' + id + '/reload')
			.pipe(take(1))
			.subscribe(() => {
				this.notificationsService.success('Task has been reloaded');
			});
	}

	public connectAs(userId: string) {
		this._restService
			.get<{ access_token: string | null; token_type: string | null }>('/login/as/' + userId)
			.pipe(take(1))
			.subscribe((r) => {
				// console.log('Result:', r);
				if (r.access_token) {
					const token = r.access_token;
					this._authService.logout(false, false);
					// console.log('Token', token);
					setTimeout(() => {
						this._authService.loginWithToken(token);
					}, 1000);
				}
			});
	}

	public getConnectAsLink$(userId: string) {
		return this._restService.get<string>('/login/as-link/' + userId).pipe(take(1));
	}

	public changePlan$(userId: string, subIdToChange: string, newPlan: string) {
		return this._restService.post<Subscription>(
			'/admin/change-plan/' + userId + '/' + subIdToChange + '/' + newPlan,
			undefined
		);
	}

	public addPlanWithEmail$(userEmail: string, plan: '') {
		return this._restService.get<Subscription>('/subscriptions/set/' + userEmail + '/' + plan);
	}

	public deletePlan(subscriptionId: string) {
		return this._restService.get<Subscription>('/subscriptions/clear-single/' + subscriptionId);
	}

	grant(groupId: string, permissionKey: string, parameters?: string, methodName?: string) {
		console.log('Granting permission:', permissionKey);

		const permission = this._permissionsManagementService.getByKey(permissionKey);
		if (!permission) {
			this.notificationsService.error(permissionKey, 'Permission not found');
			return;
		}

		const grant: Grant = {
			id: uuidv4(),
			permissionId: permission.id,
			groupId,
			parameters,
			methodName,
		};
		this._grantsManagementService.add(grant);
	}

	can(groupId: string, permissionKey: string) {
		return this._permissionService.can(permissionKey, groupId);
	}

	public getUsersAndSubscriptions$() {
		return this._restService.get<{ user: User; subscriptions: Subscription[] }[]>('/admin/users-subscriptions');
	}

	public getUsersAndSubscriptionsWithSearchValue$(searchValue: string) {
		return this._restService.get<{ user: User; subscriptions: Subscription[] }[]>(
			'/admin/users-subscriptions/' + searchValue
		);
	}
}
