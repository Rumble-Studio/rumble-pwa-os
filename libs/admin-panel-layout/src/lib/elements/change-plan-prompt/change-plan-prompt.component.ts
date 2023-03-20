import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Plan, PLANS, Subscription } from '@rumble-pwa/mega-store';
import { tap } from 'rxjs/operators';

@Component({
	selector: 'rumble-pwa-change-plan-prompt',
	templateUrl: './change-plan-prompt.component.html',
	styleUrls: ['./change-plan-prompt.component.scss'],
})
export class ChangePlanPromptComponent {
	planOptions: Plan[] = PLANS;
	optionSelected?: Plan;

	constructor(
		private _dialogRef: MatDialogRef<ChangePlanPromptComponent>,
		private _notificationsService: NotificationsService,
		@Inject(MAT_DIALOG_DATA)
		public data: { subscription?: Subscription; userSubscriptions?: Subscription[] }
	) {
		_dialogRef.disableClose = true;
		_dialogRef.backdropClick().subscribe(() => {
			this._notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this._dialogRef.close();
				}
			});
		});
		const fromAppSumo = this.data.subscription?.source === 'appsumo';
		this.planOptions = PLANS.filter((plan) => plan.grantMapping !== data.subscription?.grantMapping)
			.filter((plan) => (fromAppSumo ? plan.grantMapping.includes('tier') : !!plan))
			.filter((plan) => ['creator', 'pro', 'team'].indexOf(plan.grantMapping) < 0);
	}

	close(newPlan?: string) {
		this._dialogRef.close(newPlan);
	}

	save() {
		if (this.optionSelected && this.subscriptionAlreadyOwned(this.optionSelected)) {
			this._notificationsService
				.confirm('Are you sure?', 'This user is already a benificiary of the ' + this.optionSelected.name + ' plan.')
				.pipe(
					tap((confirm) => {
						if (confirm) this.close(this.optionSelected?.grantMapping);
					})
				)
				.subscribe();
		} else {
			this.close(this.optionSelected?.grantMapping);
		}
	}

	subscriptionAlreadyOwned(plan: Plan) {
		return this.data.userSubscriptions?.some((userSubscription) => {
			return userSubscription.grantMapping === plan.grantMapping;
		});
	}
}
