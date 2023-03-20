import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';

@Component({
	selector: 'rumble-pwa-subscription-delete-prompt',
	templateUrl: './subscription-delete-prompt.component.html',
	styleUrls: ['./subscription-delete-prompt.component.scss'],
})
export class SubscriptionDeletePromptComponent implements OnInit {
	typedName = '';
	title = '';
	constructor(
		private subscriptionsManagementService: SubscriptionsManagementService,
		@Inject(MAT_DIALOG_DATA) public data: any,
		private dialogRef: MatDialogRef<SubscriptionDeletePromptComponent>,
		private notificationsService: NotificationsService
	) {}

	ngOnInit(): void {
		this.title = this.data.title;
	}

	delete() {
		if (this.typedName.trim() === this.title.trim()) {
			this.subscriptionsManagementService.delete(this.data.id);
			this.dismiss();
		} else {
			this.notificationsService.error('The typed name does not match the subscription.', 'Mismatch');
		}
	}
	archive() {
		if (this.typedName.trim() === this.title.trim()) {
			this.subscriptionsManagementService.archive(this.data.id);
			this.dismiss();
		} else {
			this.notificationsService.error('The typed name does not match the subscription.', 'Mismatch');
			console.log({
				typedName: this.typedName,
				realName: this.title,
			});
		}
	}

	dismiss() {
		this.dialogRef.close();
	}
}
