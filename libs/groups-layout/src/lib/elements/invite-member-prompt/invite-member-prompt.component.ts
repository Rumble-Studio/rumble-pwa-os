import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Group } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';

@Component({
	selector: 'rumble-pwa-invite-member-prompt',
	templateUrl: './invite-member-prompt.component.html',
	styleUrls: ['./invite-member-prompt.component.scss'],
})
export class InviteMemberPromptComponent {
	groupForm: UntypedFormGroup;

	constructor(
		private _groupsManagementService: GroupsManagementService,
		private _dialogRef: MatDialogRef<InviteMemberPromptComponent>,
		private dialog: MatDialog,
		private usersRepository: UsersRepository,
		private formBuilder: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA)
		public group: Group
	) {
		this.groupForm = this.formBuilder.group({
			email: new UntypedFormControl('', [Validators.required, Validators.email]),
		});
	}

	public inviteUser() {
		if (!this.groupForm.valid) {
			this.groupForm.markAsDirty();
			return;
		}

		// console.log(this.groupForm.value.email, this.group);

		this._groupsManagementService.addChildToParentPerEmail(this.groupForm.value.email, this.group.id);

		this._dialogRef.close();
	}

	public dismiss() {
		this._dialogRef.close();
	}
}
