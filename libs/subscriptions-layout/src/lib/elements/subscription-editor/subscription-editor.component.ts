import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Subscription } from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
	useObsUntilDestroyed,
} from '@rumble-pwa/utils';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-subscription-editor',
	templateUrl: './subscription-editor.component.html',
	styleUrls: ['./subscription-editor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionEditorComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	user: User | null = null;
	subscriptionForm: UntypedFormGroup = new UntypedFormGroup({});

	visible = true;
	selectable = true;
	removable = true;
	addOnBlur = true;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private formBuilder: UntypedFormBuilder,
		private dialogRef: MatDialogRef<SubscriptionEditorComponent>,
		private usersRepository: UsersRepository,
		private cdr: ChangeDetectorRef,
		private notificationsService: NotificationsService,
		@Inject(MAT_DIALOG_DATA) public data?: { subscription: Subscription }
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// profile
		useObsUntilDestroyed(this.usersRepository.connectedUser$$, (p) => (this.user = p), this);

		// build form
		this.subscriptionForm = this.formBuilder.group({
			name: new UntypedFormControl('', [Validators.required, Validators.maxLength(256)]),
		});

		// patch form if subscription is provided
		if (this.data?.subscription) {
			this.subscriptionForm.patchValue({
				name: this.data.subscription.name,
			});

			this._check();
		}

		// dialog
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this.dialogRef.close();
				}
			});
		});
	}

	saveSubscriptionToLocalStore() {
		const userId = this.user?.id;
		if (!userId) {
			console.error('No connected user detected to save subscription to local store.');
			return;
		}

		console.warn('Not implemented: we should allow to save a custom name in the subscription data');

		this.dialogRef.close();
	}

	dismiss() {
		this.dialogRef.close();
	}
}
