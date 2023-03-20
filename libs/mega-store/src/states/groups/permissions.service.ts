import { Injectable } from '@angular/core';
import { Permission } from './permission.model';
import { PermissionsStore } from './permissions.store';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
	constructor(private permissionsStore: PermissionsStore) {}

	add(permission: Permission) {
		this.permissionsStore.add(permission);
	}

	update(id: string, permission: Partial<Permission>) {
		this.permissionsStore.update(id, permission);
	}

	upsert(permission: Permission) {
		this.permissionsStore.upsert(permission.id, permission);
	}

	remove(id: string) {
		this.permissionsStore.remove(id);
	}

	removeAll() {
		this.permissionsStore.remove();
	}

	upsertMany(permissions: Permission[]) {
		this.permissionsStore.upsertMany(permissions);
	}
}
