import { Component, Inject } from '@angular/core';
import { PermissionsManagementService } from '@rumble-pwa/groups-system';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Grant, Permission } from '@rumble-pwa/mega-store';

@Component({
	selector: 'rumble-pwa-grant-prompt',
	templateUrl: './grant-prompt.component.html',
	styleUrls: ['./grant-prompt.component.scss'],
})
export class GrantPromptComponent {
	permission?: Permission;
	constructor(
		private dialogRef: MatDialogRef<GrantPromptComponent>,
		private permissionsManagementService: PermissionsManagementService,
		private notificationsService: NotificationsService,
		@Inject(MAT_DIALOG_DATA) public data: { grant: Grant }
	) {
		if (data.grant.permissionId) {
			this.permission = this.permissionsManagementService.get(data.grant.permissionId);
		}
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this.dialogRef.close();
				}
			});
		});
	}

	onClose() {
		this.dialogRef.close();
	}
}
