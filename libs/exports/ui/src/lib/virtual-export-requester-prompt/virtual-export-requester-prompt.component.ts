import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
// import { GroupsElementsModule } from '@rumble-pwa/groups-layout';
import { EntityExport, VirtualExportRequestData, VirtualExportResult } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Subscription } from '@rumble-pwa/mega-store';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { UtilsModule } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-export-requester-prompt',
	standalone: true,
	imports: [
		//
		CommonModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatDialogModule,
		MatButtonModule,
		MatIconModule,
		MatTooltipModule,
		// GroupsElementsModule,
		UtilsModule,
		MatSelectModule,
		FormsModule,
		MatInputModule,
		GroupItemGenericComponent,
		TrackClickDirective,
	],
	templateUrl: './virtual-export-requester-prompt.component.html',
	styleUrls: ['./virtual-export-requester-prompt.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualExportRequesterPromptComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged
{
	subscriptions: Subscription[] = [];

	// became true once loaded: first time will update the form to use the first with available credits
	private _subscriptionsLoaded = false;
	exportForm: FormGroup;

	nameMaxLength = 128;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _dialogRef: MatDialogRef<VirtualExportRequesterPromptComponent, VirtualExportResult>,
		private _notificationsService: NotificationsService,
		private _subscriptionsManagementService: SubscriptionsManagementService,
		private _usersRepository: UsersRepository,
		private _exportsRepository: ExportsRepository,
		@Inject(MAT_DIALOG_DATA) public data: VirtualExportRequestData,
		private formBuilder: FormBuilder
	) {
		super(_cdr, _layoutService, _activatedRoute);

		const now = new Date();
		const name = this.data.exportName ?? 'Export - ' + now.getTime();

		console.log('Data received:', this.data, this.data.virtualPlaylists);
		if (this.data.virtualPlaylists.length === 0) {
			this._notificationsService.error('No playlists to export');
			this.dismiss();
		}

		this.exportForm = this.formBuilder.group({
			name: new FormControl(name, {
				validators: [Validators.required, Validators.maxLength(this.nameMaxLength)],
				nonNullable: true,
			}),
			description: new FormControl('', [Validators.maxLength(1024)]),
			audioFormat: new FormControl('mp3_ld', {
				validators: [Validators.required],
				nonNullable: true,
			}),
			onlyRawData: new FormControl(false),
			subscription: new FormControl<Subscription | null>(null, [Validators.required]),
		});

		// refresh subscriptions status
		this._subscriptionsManagementService.pullDataOnce();

		// get all subscriptions
		this._subscriptionsManagementService
			.getAll$()
			.pipe(
				untilDestroyed(this),
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
					if (!this._subscriptionsLoaded) {
						// this._subscriptionsLoaded = true;
						const firstSubscriptionWithCredits = subscriptions.find((subscription) => {
							return (subscription.durationExported ?? 0) < (subscription.maxDurationExported ?? 0);
						});
						console.log('firstSubscriptionWithCredits', firstSubscriptionWithCredits);

						if (firstSubscriptionWithCredits) {
							this.exportForm.patchValue({
								subscription: firstSubscriptionWithCredits,
							});
						}
					}

					this._check();
				})
			)
			.subscribe();
	}

	dismiss() {
		this._dialogRef.close({
			export: undefined,
			exportRequest: this.data,
		});
	}

	public save() {
		//
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;

		const name = this.exportForm?.value.name;
		const audioFormat = this.exportForm?.value.audioFormat;
		const onlyRawData = this.exportForm?.value.onlyRawData;
		const virtualPlaylists = this.data.virtualPlaylists;
		const subscriptionId = this.exportForm?.value.subscription?.id;
		const description = this.exportForm?.value.description;

		console.log(
			'[VirtualExportRequesterPromptComponent] save()',
			'subscriptionId:',
			subscriptionId,
			'name:',
			name,
			'ownerId:',
			ownerId
		);

		if (!subscriptionId || !name || !ownerId) return;

		const completedExportRequest: VirtualExportRequestData = {
			virtualPlaylists,
			exportName: name,
			audioFormat,
			onlyRawData,
			exportSource: this.data.exportSource,
		};

		const hasMix = this.data.exportSource?.kind === 'mix';

		const exportSource = this.data.exportSource;

		const entityExport: EntityExport = {
			id: uuidv4(),
			ownerId,
			subscriptionId,
			name,
			description,
			data: JSON.stringify(completedExportRequest),
			mixId: hasMix && exportSource ? exportSource.id : undefined,
		};
		this._exportsRepository.addWithCheck(entityExport);
		this._dialogRef.close({
			export: entityExport,
			exportRequest: completedExportRequest,
		});
		this._notificationsService.success(
			'Export request sent, you will receive an email and a notification when it is ready.'
		);
	}

	public isSubscriptionDisabled(subscription: Subscription) {
		const durationExported = subscription.durationExported ?? 0;
		const durationTotal = subscription.maxDurationExported ?? 0;
		return durationExported >= durationTotal;
	}
	public subscriptionExportLeft(subscription: Subscription) {
		const durationExported = subscription.durationExported ?? 0;
		const durationTotal = subscription.maxDurationExported ?? 0;
		return durationTotal - durationExported;
	}
}
