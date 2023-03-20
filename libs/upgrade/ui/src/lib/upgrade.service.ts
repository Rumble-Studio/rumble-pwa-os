import { Injectable } from '@angular/core';
import { PermissionService } from '@rumble-pwa/groups-system';
import { Subscription, SubscriptionsQuery } from '@rumble-pwa/mega-store';
import { Upgrade } from '@rumble-pwa/upgrade/models';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class UpgradeService {
	subscriptions: Subscription[] = [];
	profile: User | null = null;

	constructor(
		private _usersRepository: UsersRepository,
		private subscriptionsQuery: SubscriptionsQuery,
		private _permissionService: PermissionService
	) {
		// get a profile copy
		this._usersRepository.connectedUser$$
			.pipe(
				filter((profile) => profile != this.profile),
				tap((profile) => {
					this.profile = profile;
				})
			)
			.subscribe();

		// get subscriptions
		this.subscriptionsQuery.subscriptions$
			.pipe(
				tap((subscriptions) => {
					this.subscriptions = subscriptions;
				})
			)
			.subscribe();
	}

	/**
	 * Method that checks for every upgrade.grantsRequired and
	 * upgrade.permissionsRequired if the user has the corresponding grants/permissions.
	 *
	 * @param upgrade Upgrade object
	 * @returns true as observable if user has all grants required AND all permissions required
	 */
	checkGrantsAndPermissionsState$(upgrade?: Upgrade) {
		if (!upgrade) return of(true);
		if (upgrade.customCondition !== undefined) return of(!upgrade.customCondition);
		const grantsRequired = upgrade.grantsRequired ?? [];
		const permissionsRequired = upgrade.permissionsRequired ?? [];

		if (grantsRequired.length === 0 && permissionsRequired.length === 0) return of(true);

		const grantsRequiredWithState$: Observable<boolean>[] = grantsRequired.map((grantRequired) => {
			return combineLatest([this._usersRepository.connectedUser$$, this.subscriptionsQuery.subscriptions$]).pipe(
				map(([, subscriptions]) => {
					return subscriptions.some((subscription) => subscription.grantMapping === grantRequired);
				})
			);
		});

		const permissionsRequiredWithSate$: Observable<boolean>[] = permissionsRequired.map((permissionRequired) => {
			return this._permissionService.can$(permissionRequired);
		});

		return combineLatest([...grantsRequiredWithState$, ...permissionsRequiredWithSate$]).pipe(
			map((grantsAndPermissionsWithState) => {
				return grantsAndPermissionsWithState.every((state) => state);
			})
		);
	}
}
