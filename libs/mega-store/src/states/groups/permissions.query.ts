import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Permission } from './permission.model';
import { PermissionsStore, PermissionsState } from './permissions.store';

@Injectable({ providedIn: 'root' })
export class PermissionsQuery extends QueryEntity<PermissionsState> {
	permissions$: Observable<Permission[]> = this.selectAll({
		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
	});
	permissions$$: BehaviorSubject<Permission[]> = new BehaviorSubject<Permission[]>([] as Permission[]);
	permissionsToSync$: Observable<Permission[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: PermissionsStore) {
		super(store);
		this.permissions$.subscribe(this.permissions$$);
	}
}
