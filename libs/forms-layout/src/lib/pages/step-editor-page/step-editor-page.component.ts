import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { StepsManagementService } from '@rumble-pwa/forms-system';
import { Step } from '@rumble-pwa/mega-store';
import { DataObsViaId, getRouteParam$ } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-step-editor-page',
	templateUrl: './step-editor-page.component.html',
	styleUrls: ['./step-editor-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepEditorPageComponent {
	// interview data
	step$$$ = new DataObsViaId<Step>((stepId: string) => this.stepsManagementService.get$(stepId));

	constructor(
		private activatedRoute: ActivatedRoute,
		private stepsManagementService: StepsManagementService,
		private cdr: ChangeDetectorRef
	) {
		// read param from route
		getRouteParam$(this.activatedRoute, 'stepId')
			.pipe(
				untilDestroyed(this),
				tap((stepId) => {
					this.step$$$.id = stepId;
					this.check();
				})
			)
			.subscribe();
	}

	check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
