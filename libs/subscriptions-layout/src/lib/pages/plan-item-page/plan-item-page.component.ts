import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { getRouteParam$, getRouteQueryParam$ } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-plan-item-page',
	templateUrl: './plan-item-page.component.html',
	styleUrls: ['./plan-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanItemPageComponent {
	grantMapping?: string;

	constructor(
		//
		private activatedRoute: ActivatedRoute,
		private cdr: ChangeDetectorRef
	) {
		getRouteParam$(this.activatedRoute, 'grantMapping')
			.pipe(
				untilDestroyed(this),
				tap((grantMapping) => {
					this.grantMapping = grantMapping ?? undefined;
					this._check();
				})
			)
			.subscribe();
	}

	private _check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
