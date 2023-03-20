import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Permission, PermissionsQuery, PermissionsService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, take, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class PermissionsManagementService {
	permissions$$: BehaviorSubject<Permission[]>;

	serverReachedLocalKey = 'serverReached.' + this.constructor.name;
	serverReached$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private restService: RestService,
		private permissionsService: PermissionsService,
		private permissionsQuery: PermissionsQuery,
		private _usersRepository: UsersRepository
	) {
		this.permissions$$ = this.permissionsQuery.permissions$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				// data reloaded from local storage
				this.serverReached$$.next(localStorage.getItem(this.serverReachedLocalKey) === 'true');

				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get permissions data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Permission[]>('/permissions').subscribe((permissionApis) => {
					// upsert permissions to local store
					this.permissionsService.upsertMany(
						permissionApis.map((permissionApis) => {
							return { ...permissionApis, operation: 'refresh' };
						})
					);

					// data loaded from server
					localStorage.setItem(this.serverReachedLocalKey, 'true');
					this.serverReached$$.next(true);
				});
		});
	}

	pushData() {
		this.permissionsQuery.permissionsToSync$.pipe(debounceTime(1000)).subscribe((permissions) => {
			permissions.forEach((permission) => {
				if (permission?.operation === 'creation') {
					this._postToServer(permission);
				} else if (permission?.operation === 'update') this._putToServer(permission);
			});
		});
	}

	public add(data: Permission) {
		this.permissionsService.add(data);
	}
	public update(id: string, data: Partial<Permission>) {
		this.permissionsService.update(id, data);
	}
	public removeFromStore(id: string) {
		this.permissionsService.remove(id);
	}
	public delete(id: string) {
		this.permissionsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.permissionsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.permissionsService.update(id, { state: 'default' });
	}

	public getAll$() {
		return this.permissionsQuery.selectAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getAll() {
		return this.permissionsQuery.getAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public get(id: string) {
		return this.permissionsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.permissionsQuery.selectEntity(id);
	}

	public getByKey$(key: string) {
		this.permissionsQuery.selectEntity(
			(entity: Permission) => entity.key === key && ['deleted', 'archived'].indexOf(entity.state || 'default') == -1
		);
	}
	public getByKey(key: string) {
		const r = this.permissionsQuery.getAll({
			limitTo: 1,
			filterBy: (entity) => entity.key === key && ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
		if (r.length > 0) return r[0];
		return null;
	}

	//
	// SERVER SYNC
	//
	private _putToServer(permission: Permission) {
		return this.restService
			.put<Permission>('/permissions/' + permission.id, permission)
			.pipe(
				tap((r) => {
					this.permissionsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(permission: Permission) {
		return this.restService
			.post<Permission>('/permissions', permission)
			.pipe(
				tap((r) => {
					this.permissionsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
}
