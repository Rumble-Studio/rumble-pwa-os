import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Mix, MixDetails, Subscription } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { DataObsViaId } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { EntityExport } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
@UntilDestroy()
@Component({
	selector: 'rumble-pwa-mix-request-export-prompt',
	templateUrl: './mix-request-export-prompt.component.html',
	styleUrls: ['./mix-request-export-prompt.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixRequestExportPromptComponent {
	mix$$$ = new DataObsViaId<Mix>((mixId: string) => this._mixesManagementService.get$(mixId).pipe(untilDestroyed(this)));
	exports: EntityExport[] = [];

	subscriptions: Subscription[] = [];
	exportForm?: UntypedFormGroup;

	constructor(
		private _cdr: ChangeDetectorRef,
		private _dialogRef: MatDialogRef<MixRequestExportPromptComponent, string>,
		// private filesRepository: FilesRepository,
		private _notificationsService: NotificationsService,
		private _mixesManagementService: MixesManagementService,
		private _exportsRepository: ExportsRepository,
		private _subscriptionsManagementService: SubscriptionsManagementService,
		private _usersRepository: UsersRepository,
		private _formBuilder: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA)
		public mixDetails: MixDetails
	) {
		// refresh subscriptions status
		this._subscriptionsManagementService.pullDataOnce();

		_dialogRef.keydownEvents().subscribe((event) => {
			if (event.key === 'Escape') {
				this.dismiss();
			}
			this._check();
		});

		this.mix$$$.id = mixDetails.mixId;

		this._subscriptionsManagementService
			.getAll$()
			.pipe(
				untilDestroyed(this),
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
					this._check();
				})
			)
			.subscribe();

		this.mix$$$.$.pipe(
			untilDestroyed(this),
			tap(() => this._check)
		).subscribe();

		this.mix$$$.$.pipe(
			untilDestroyed(this),
			switchMap((mix) => {
				if (!mix) return of([]);
				return this._exportsRepository.getExportEntitiesByMixId$(mix.id);
			}),
			tap((exports) => {
				this.exports = exports;
				this._check();
			})
		).subscribe();

		const name: string =
			(this.mix$$$.value?.name ? this.mix$$$.value?.name + ' ' : '') +
			'[exported at ' +
			new Date().toLocaleString() +
			']';

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.exportForm = this._formBuilder.group({
					name: new UntypedFormControl(name, [Validators.required, Validators.maxLength(128)]),
					description: new UntypedFormControl('', [Validators.maxLength(1024)]),
					subscriptions: new UntypedFormControl(undefined, [Validators.required]),
				});
			});
	}

	dismiss() {
		this._dialogRef.close();
	}

	save() {
		//
		const subscriptionId: string = this.exportForm?.value.subscriptions?.id;
		const mix = this.mix$$$.value;
		const name = this.exportForm?.value.name;
		const ownerId = this._usersRepository.connectedUser$$.value?.id;
		if (!subscriptionId || !mix || !name || !ownerId) return;
		const mixId = mix.id;

		const description = this.exportForm?.value.description;
		const entityExport: EntityExport = {
			id: uuidv4(),
			ownerId,
			mixId,
			subscriptionId,
			name,
			description,
			data: mix.data,
		};
		this._exportsRepository.addWithCheck(entityExport);
		this._dialogRef.close(entityExport.id);
	}

	isSubscriptionDisabled(subscription: Subscription) {
		const durationExported = subscription.durationExported ?? 0;
		const durationTotal = subscription.maxDurationExported ?? 0;
		return durationExported >= durationTotal;
	}
	subscriptionExportLeft(subscription: Subscription) {
		const durationExported = subscription.durationExported ?? 0;
		const durationTotal = subscription.maxDurationExported ?? 0;
		return durationTotal - durationExported;
	}

	private _check() {
		setTimeout(() => {
			this._cdr.detectChanges();
		});
	}
}
