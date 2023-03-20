import { Injectable } from '@angular/core';
import { GrantsManagementService } from '..';
// import { UsersRepository } from '@rumble-pwa/users/state';
import { Grant } from '@rumble-pwa/mega-store';
import { Observable, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { UsersRepository } from '@rumble-pwa/users/state';

// dict of callable
// eslint-disable-next-line @typescript-eslint/ban-types
const debug = false;
@Injectable({
	providedIn: 'root',
})
export class PermissionService {
	// this service should load the user form the auth service and check if the user has the permission

	permissionMap = new Map<string, Observable<boolean>>();

	constructor(private _usersRepository: UsersRepository, private grantsManagementService: GrantsManagementService) {}

	can$(permissionKey: string, groupId?: string): Observable<boolean> {
		const key = permissionKey + (groupId ?? '');
		if (this.permissionMap.has(key)) {
			return this.permissionMap.get(key) as Observable<boolean>;
		}
		const permission$ = this._can$(permissionKey, groupId).pipe(shareReplay());
		this.permissionMap.set(key, permission$);
		return permission$;
	}

	_can$(permissionKey: string, groupId?: string): Observable<boolean> {
		return this._usersRepository.connectedUser$$.pipe(
			map((profile) => groupId ?? profile?.id),
			switchMap((profileId) => {
				if (profileId) {
					return this.grantsManagementService.getByGroupIdAndPermissionId$(profileId, permissionKey);
				}
				return of([] as Grant[]);
			}),
			map((grants) => {
				if (debug) console.log('grants', grants);
				// loop over grants
				for (const grant of grants) {
					if (debug) console.log('Considering this grant for ' + permissionKey, grant);
					// 2. if target in grant, check target proposed
					if (grant.parameters) {
						if (debug)
							console.warn(
								'This grant has some parameters:' + grant.parameters + ". We can't eval this grant client-side."
							);
						continue;
					}
					// 3. if method_name in grant, eval the granting_method with this name
					if (grant.methodName) {
						if (debug)
							console.warn(
								'This grant has a granting method:' +
									grant.methodName +
									". We can't eval this grant client-side."
							);
						continue;
					}
					// 4. if everything is ok: allow action
					return true;
				}
				return false;
			}),
			startWith(false)
		);
	}

	can(permissionKey: string, groupId?: string): boolean {
		const groupIdToCheck = groupId ?? this._usersRepository.connectedUser$$?.getValue()?.id;
		if (!groupIdToCheck) {
			if (debug) console.error('No groupId to check');
			return false;
		}
		if (debug) console.log('Checking permission', permissionKey, 'for group', groupIdToCheck);
		//     Pour savoir si un group peut effectuer une action:
		// 1. chercher les grants de ce groupe avec la key associée à l'action
		const grants = this.grantsManagementService.getByGroupIdAndPermissionId(groupIdToCheck, permissionKey);

		// loop over grants
		for (const grant of grants) {
			if (debug) console.log('Considering this grant for ' + permissionKey, grant);
			// 2. if target in grant, check target proposed
			if (grant.parameters) {
				if (debug)
					console.warn(
						'This grant has some parameters:' + grant.parameters + ". We can't eval this grant client-side."
					);
				continue;
			}
			// 3. if method_name in grant, eval the granting_method with this name
			if (grant.methodName) {
				if (debug)
					console.warn(
						'This grant has a granting method:' + grant.methodName + ". We can't eval this grant client-side."
					);
				continue;
			}
			// 4. if everything is ok: allow action
			return true;
		}
		return false;
	}

	// can_back(requestedPermissionKey: string): boolean {
	//   // TODO: start from connected user private group, loop over parents, save tested groups and loop over parents, etc...

	//   const groups = this.groupsManagementService.getAll();
	//   console.log('Your groups', groups);
	//   // loop over groups to find the group that has the permission
	//   for (const group of groups) {
	//     // check if the group has the permission
	//     if (!group.grants) {
	//       console.log('This group has no grants', group);
	//       return false;
	//     }
	//     for (const grant of group.grants) {
	//       const permission = this.permissionsManagementService.get(
	//         grant.permissionId
	//       );
	//       if (requestedPermissionKey === permission?.key) {
	//         rslog(this, 'can', 'pink', requestedPermissionKey, {
	//           permission,
	//           group,
	//           grant,
	//         });
	//         return true;
	//       }
	//     }
	//   }
	//   rslog(this, "can't", 'red', {
	//     requestedPermissionKey,
	//     group: undefined,
	//     grant: undefined,
	//   });
	//   return false;
	// }
}
