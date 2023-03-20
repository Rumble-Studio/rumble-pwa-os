import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ToSync } from '../../others/akita.utils';
import { Permission } from './permission.model';

export interface PermissionsState extends EntityState<Permission> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'permissions', resettable: true })
@ToSync<Permission>()
export class PermissionsStore extends EntityStore<PermissionsState> {
	constructor() {
		super();
	}
}
