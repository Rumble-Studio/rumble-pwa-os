import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FEATURES_ALWAYS_INCLUDED as ALWAYS_INCLUDED_FEATURES, Plan, PLANS } from '@rumble-pwa/mega-store';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { DataObsViaId } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-plan-item',
	templateUrl: './plan-item.component.html',
	styleUrls: ['./plan-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanItemComponent {
	alwaysIncludedFeatures = ALWAYS_INCLUDED_FEATURES;

	@Input()
	showMoreDetailsBtn = false;
	subscriptions$$$ = new DataObsViaId((grantMapping: string) =>
		this.usersRepository.connectedUser$$.pipe(
			switchMap((profile) => {
				if (profile?.id)
					return this.subscriptionsManagementService.getSubscriptionsAsBeneficiary$(profile.id, grantMapping);
				return of([]);
			})
		)
	);

	private _plan?: Plan;
	public get plan() {
		return this._plan;
	}
	public set plan(value) {
		this._plan = value;
	}

	private _grantMapping?: string;
	public get grantMapping() {
		return this._grantMapping;
	}
	@Input()
	public set grantMapping(value) {
		this._grantMapping = value;

		if (value) this.plan = PLANS.find((plan) => plan.grantMapping === value);
		this.subscriptions$$$.id = value;
		this._check();
	}

	constructor(
		private usersRepository: UsersRepository,
		private subscriptionsManagementService: SubscriptionsManagementService,
		private cdr: ChangeDetectorRef
	) {
		this.subscriptions$$$.$.pipe(
			untilDestroyed(this),
			tap((subs) => {
				// console.log('subs', subs);
				this._check();
			})
		).subscribe();
	}

	private _check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
