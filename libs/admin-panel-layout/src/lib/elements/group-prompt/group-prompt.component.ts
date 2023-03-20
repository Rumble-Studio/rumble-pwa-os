import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GroupsManagementService, PermissionsManagementService } from '@rumble-pwa/groups-system';
import { Group, Permission } from '@rumble-pwa/mega-store';

@Component({
	selector: 'rumble-pwa-group-prompt',
	templateUrl: './group-prompt.component.html',
	styleUrls: ['./group-prompt.component.scss'],
})
export class GroupPromptComponent {
	permission: { [key: string]: Permission | undefined } = {};

	constructor(
		private dialogRef: MatDialogRef<GroupPromptComponent>,
		private notificationsService: NotificationsService,
		private groupsManagementService: GroupsManagementService,
		private permissionsManagementService: PermissionsManagementService,
		@Inject(MAT_DIALOG_DATA)
		public data: { group: Group; isParent: boolean; fromGroup: string }
	) {
		if (data.group.grants) {
			data.group.grants.forEach((grant) => {
				this.permission[grant.id] = this.permissionsManagementService.get(grant.permissionId);
			});
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

	onRemove() {
		const parent = this.data.isParent ? this.data.fromGroup : this.data.group.id;
		const child = this.data.isParent ? this.data.group.id : this.data.fromGroup;

		this.groupsManagementService.removeChildFromParent(parent, child);

		this.dialogRef.close();
	}
}
