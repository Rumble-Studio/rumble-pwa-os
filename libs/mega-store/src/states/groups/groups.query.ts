import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { GroupsStore, GroupsState } from './groups.store';
import { BehaviorSubject, Observable } from 'rxjs';
import { Group } from './group.model';
import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
import { isEqual } from 'lodash';

@Injectable({ providedIn: 'root' })
export class GroupsQuery extends QueryEntity<GroupsState> {
	groups: Group[] = [];

	groups$: Observable<Group[]> = this.selectAll({
		filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
	}).pipe(
		filter((groups) => !isEqual(this.groups, groups)),
		tap((groups) => {
			this.groups = groups;
		}),
		shareReplay()
	);
	groups$$ = new BehaviorSubject<Group[]>([] as Group[]);
	groupsToSync$: Observable<Group[]> = this.selectAll({
		filterBy: (entity) => entity.toSync === true,
	}).pipe(debounceTime(300));
	constructor(protected store: GroupsStore) {
		super(store);
		this.groups$.subscribe(this.groups$$);
	}
}
