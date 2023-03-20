import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Group } from '@rumble-pwa/mega-store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
	selector: 'rumble-pwa-add-group-parent',
	templateUrl: './add-group-parent.component.html',
	styleUrls: ['./add-group-parent.component.scss'],
})
export class AddGroupParentComponent {
	groupsId: string[] = [];
	groupControl = new UntypedFormControl();
	filteredGroups: Observable<string[]>;

	constructor(
		private dialogRef: MatDialogRef<AddGroupParentComponent>,
		private groupsManagementService: GroupsManagementService,
		private notificationsService: NotificationsService,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			group: Group;
		}
	) {
		this.groupsId = this.groupsManagementService.groups$$.value
			.map((group) => group.id)
			.filter((groupsId) => groupsId !== this.data.group.id) // remove current group
			.filter(
				(groupsId) => !this.data.group.parentIds?.includes(groupsId) // remove already parents
			); // remove already parents

		this.filteredGroups = this.groupControl.valueChanges.pipe(
			startWith(''),
			map((value) => this._filter(value))
		);
	}

	private _filter(value: string): string[] {
		const filterValue = value.toLowerCase();

		return this.groupsId.filter((group) => group.toLowerCase().includes(filterValue));
	}
	save() {
		const groupIdTarget = this.groupControl.value;
		if (!this.groupsId.includes(groupIdTarget)) {
			this.notificationsService.error('Could not match group ID');
			return;
		}

		this.groupsManagementService.addChildToParent(this.data.group.id, groupIdTarget);

		console.log('Parents: ' + groupIdTarget + ' added to: ' + this.data.group.id);

		this.dialogRef.close({ updated: true });
	}
	dismiss() {
		this.dialogRef.close({ updated: false });
	}
}
