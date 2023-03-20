import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Group, GroupsQuery, GroupsService } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, debounceTime, take, tap } from 'rxjs/operators';
const debug = false;

@Injectable({
	providedIn: 'root',
})
export class GroupsManagementService {
	groups$$: BehaviorSubject<Group[]>;

	constructor(
		private restService: RestService,
		private groupsService: GroupsService,
		private groupsQuery: GroupsQuery,
		private _usersRepository: UsersRepository,
		private _notificationsService: NotificationsService
	) {
		this.groups$$ = this.groupsQuery.groups$$;

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get groups data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this.restService.get<Group[]>('/groups').subscribe((groupApis) => {
					// upsert groups to local store
					this.groupsService.upsertMany(
						groupApis.map((groupApis) => {
							return { ...groupApis, operation: 'refresh' };
						})
					);
				});
		});
	}

	pullDataOnce() {
		this._usersRepository.isConnected$$.pipe(take(1)).subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				// get group data from server
				this.restService.get<Group[]>('/groups').subscribe((groupApis) => {
					this.groupsService.upsertMany(
						groupApis.map((groupApis) => {
							return { ...groupApis, operation: 'refresh' };
						})
					);
				});
			}
		});
	}

	pushData() {
		this.groupsQuery.groupsToSync$.pipe(debounceTime(1000)).subscribe((groups) => {
			groups.forEach((group) => {
				if (group?.operation === 'creation') {
					this._postToServer(group);
				} else if (group?.operation === 'update') this._putToServer(group);
			});
		});
	}

	public add(data: Group) {
		this.groupsService.add(data);
	}
	public update(id: string, data: Partial<Group>) {
		this.groupsService.update(id, data);
	}
	public removeFromStore(id: string) {
		this.groupsService.remove(id);
	}
	public delete(id: string) {
		this.groupsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this.groupsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this.groupsService.update(id, { state: 'default' });
	}

	public getAll$() {
		return this.groupsQuery.selectAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public getAll() {
		return this.groupsQuery.getAll({
			filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
	}

	public get(id: string) {
		return this.groupsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this.groupsQuery.selectEntity(id);
	}

	//
	// SERVER SYNC
	//
	private _putToServer(group: Group) {
		return this.restService
			.put<Group>('/groups/' + group.id, group)
			.pipe(
				tap((r) => {
					this.groupsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(group: Group) {
		return this.restService
			.post<Group>('/groups', group)
			.pipe(
				tap((r) => {
					this.groupsService.upsert({ ...r, operation: 'refresh' });
					this.pushData();
				})
			)
			.subscribe();
	}

	fillChildrenRecursively(
		baseGroupId: string,
		currentDepth: number = 0,
		groupsIdsToIgnore: Set<string> = new Set(),
		maxDepth?: number,
		originGroup?: Group,
		filterArchived = false,
		filterDeleted = true
	): Group | undefined {
		// convert groupId to group
		const storeGroup = this.get(baseGroupId);
		if (!storeGroup) return undefined;

		const group: Group = { ...storeGroup, originGroup };

		// no need to be recursive if no children
		if (!group.childIds) return group;
		if (group.childIds.length === 0) return group;

		if (maxDepth && maxDepth <= currentDepth) {
			return group;
		}

		const newGroupsIdsToIgnore = new Set(groupsIdsToIgnore.values());

		const stateFilter: Array<string | undefined> = [];
		if (filterArchived) stateFilter.push('archived');
		if (filterDeleted) stateFilter.push('deleted');

		const children: Group[] = group.childIds
			.map((childId) => {
				if (newGroupsIdsToIgnore.has(childId)) return this.get(childId);
				return this.fillChildrenRecursively(childId, currentDepth + 1, newGroupsIdsToIgnore, maxDepth, storeGroup);
			})
			.filter((child): child is Group => !!child)
			.filter((child) => !stateFilter.includes(child.state));

		// even if we have child ids, maybe the store has not them in stock
		if (children.length === 0) return group;

		const updatedGroup: Group = {
			...group,
			children,
		};

		return updatedGroup;
	}

	public addChildToParentPerEmail(email: string, groupParentId: string) {
		this.restService
			.post<Group[]>('/groups/add-per-email/' + groupParentId + '/' + email, {})
			.pipe(
				tap((groups) => {
					// this._usersRepository.pullDataOnce();
					// this._filesRepository.pullDataOnce();
					this.groupsService.upsertMany(groups.map((group) => ({ ...group, operation: 'refresh' })));
				}),
				catchError((err) => {
					console.log({ err });

					this._notificationsService.warning(
						err.error?.detail ?? 'An error occured during the operation.',
						'Error',
						undefined,
						undefined,
						20000
					);
					return of();
				})
			)
			.subscribe();
	}

	public addChildToParent(groupChildId: string, groupParentId: string) {
		this.restService
			.post<Group[]>('/groups/add/' + groupParentId + '/' + groupChildId, {})
			.pipe(
				tap((groups) => {
					groups.forEach((group) => {
						this.groupsService.upsert({ ...group, operation: 'refresh' });
					});
				}),
				catchError((err) => {
					console.log({ err });

					this._notificationsService.warning(
						err.error?.detail ?? 'An error occured during the operation.',
						'Error',
						undefined,
						undefined,
						20000
					);
					return of();
				})
			)
			.subscribe();
	}

	public removeChildFromParent(groupChildId: string, groupParentId: string) {
		this.restService
			.post<Group[]>('/groups/remove/' + groupParentId + '/' + groupChildId, {})
			.pipe(
				tap((groups) => {
					groups.forEach((group) => {
						this.groupsService.upsert({ ...group, operation: 'refresh' });
					});
				})
			)
			.subscribe();
	}

	public getGroupAsSearchableTerm(groupId: string) {
		let searchTerm = '';
		const group = this.get(groupId);
		if (!group) return searchTerm;
		searchTerm += ' ' + group.name + ' ' + group.description;
		// if (group.kind === 'user') {
		// 	const user = this._usersRepository.get(group.id);
		// 	if (user) {
		// 		searchTerm = user.fullName + ' ' + user.email + searchTerm;
		// 	}
		// }
		return searchTerm;
	}

	showableParents(groupId: string): Group[] {
		const group = this.get(groupId);
		if (!group) return [];
		// console.log('showableParents', group.parentIds);

		return (
			group.parentIds
				?.map((parentId) => this.get(parentId))
				.filter((parent): parent is Group => !!parent)
				.filter((group) => group.state === 'default') ?? []
		);
		// return (group.parentIds ?? []).filter((parentId) => this.get(parentId));
	}

	showableChildren(groupId: string, withOwner = false): Group[] {
		const group = this.get(groupId);
		if (!group) return [];
		const showableChildren =
			group.childIds?.map((childId) => this.get(childId)).filter((child): child is Group => !!child) ?? [];
		const showableChildrenWithoutOwner = showableChildren?.filter((group) => group.kind !== 'user') ?? [];
		return withOwner ? showableChildren : showableChildrenWithoutOwner;
	}
	/**
	 * @param groupId
	 * @param kind
	 * @returns true when the group has no parent with the same kind
	 */
	groupIsARootGroup(groupId: string, kind: string): boolean {
		const group = this.get(groupId);
		if (!group) return false;

		const parents =
			group.parentIds?.map((parentId) => this.get(parentId)).filter((parent): parent is Group => !!parent) ?? [];
		const isRoot = parents.every((parent) => {
			if (parent.kind === kind && debug) {
				console.log('(groupIsARootGroup) ' + group.name + ' is not root because of:', parent.name);
			}
			return parent.kind !== kind;
		});

		return isRoot;
	}
}
