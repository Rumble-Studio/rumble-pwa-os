import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Grant, GrantsQuery, GrantsService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, take, tap } from 'rxjs/operators';

function IsJsonString(str: string) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

@Injectable({
	providedIn: 'root',
})
export class GrantsManagementService {
	grants$$: BehaviorSubject<Grant[]>;

	public grantsLoaded$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private restService: RestService,
		private grantsService: GrantsService,
		private grantsQuery: GrantsQuery,
		private _usersRepository: UsersRepository,
		private notificationsService: NotificationsService
	) {
		this.grants$$ = this.grantsQuery.grants$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get grants data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				// connected means persist state is loaded
				this.grantsLoaded$$.next(true);

				this.restService.get<Grant[]>('/grants').subscribe((grantApis) => {
					// upsert grants to local store
					this.grantsService.set(
						grantApis.map((grantApis) => {
							return { ...grantApis, operation: 'refresh' };
						})
					);
				});
			} else {
				this.grantsLoaded$$.next(false);
			}
		});
	}

	pullDataOnce() {
		// get grants data from server
		this._usersRepository.isConnected$$.pipe(take(1)).subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				// connected means persist state is loaded
				this.grantsLoaded$$.next(true);

				this.restService.get<Grant[]>('/grants').subscribe((grantApis) => {
					// upsert grants to local store
					this.grantsService.set(
						grantApis.map((grantApis) => {
							return { ...grantApis, operation: 'refresh' };
						})
					);
				});
			} else {
				this.grantsLoaded$$.next(false);
			}
		});
	}

	pushData() {
		this.grantsQuery.grantsToSync$.pipe(debounceTime(1000)).subscribe((grants) => {
			grants.forEach((grant) => {
				if (grant?.operation === 'creation') {
					this._postToServer(grant);
				} else if (grant?.operation === 'update') this._putToServer(grant);
			});
		});
	}

	public add(data: Grant) {
		if (!this.checkParameters(data.parameters)) {
			this.notificationsService.error('Incorrect parameters');
			return;
			// notif error params incorrect
		}
		this.grantsService.add(data);
	}
	public update(id: string, data: Partial<Grant>) {
		if (!this.checkParameters(data.parameters)) {
			this.notificationsService.error('Incorrect parameters');
			return;
			// notif error params incorrect
		}
		this.grantsService.update(id, data);
	}
	public removeFromStore(id: string) {
		console.log('[' + this.constructor.name + ']', '(removeFromStore)', 'id', id);

		this.grantsService.remove(id);
	}
	public delete(id: string) {
		this.grantsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.grantsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.grantsService.update(id, { state: 'default' });
	}

	public getAll$(noFilter?: boolean) {
		return this.grantsQuery.selectAll({
			filterBy: (entity) => noFilter ?? ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getAll() {
		return this.grantsQuery.getAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getByGroupIdAndPermissionId$(groupId: string, permissionId: string) {
		return this.grantsQuery.selectAll({
			filterBy: (entity) =>
				entity.groupId === groupId &&
				entity.permissionId === permissionId &&
				['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}
	public getByGroupIdAndPermissionId(groupId: string, permissionId: string) {
		return this.grantsQuery.getAll({
			filterBy: (entity) =>
				entity.groupId === groupId &&
				entity.permissionId === permissionId &&
				['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public get(id: string) {
		return this.grantsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.grantsQuery.selectEntity(id);
	}

	public getMethods$() {
		return this.restService.get<string[]>('/grants/methods/list');
	}

	//
	// SERVER SYNC
	//
	private _putToServer(grant: Grant) {
		return this.restService
			.put<Grant>('/grants/' + grant.id, grant)
			.pipe(
				tap((r) => {
					this.grantsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(grant: Grant) {
		return this.restService
			.post<Grant>('/grants', grant)
			.pipe(
				tap((r) => {
					this.grantsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	checkParameters(parameters?: string) {
		if (!parameters) return true;
		return IsJsonString(parameters);
	}
}
