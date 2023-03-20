import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Group, GroupDetails } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';
import { filter, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Component({
	selector: 'rumble-pwa-group-properties-prompt',
	templateUrl: './group-properties-prompt.component.html',
	styleUrls: ['./group-properties-prompt.component.scss'],
})
export class GroupPropertiesPromptComponent {
	groupForm: UntypedFormGroup;

	constructor(
		private _groupsManagementService: GroupsManagementService,
		private _dialogRef: MatDialogRef<GroupPropertiesPromptComponent>,
		private _usersRepository: UsersRepository,
		private _router: Router,
		private _formBuilder: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA)
		public groupDetails: GroupDetails,
		private _notificationService: NotificationsService
	) {
		if (!groupDetails.kind && !groupDetails.group?.kind) console.warn('groupDetails, missing kind', groupDetails);

		this.groupForm = this._formBuilder.group({
			name: new UntypedFormControl(this.groupDetails.group?.name || '', [Validators.required, Validators.maxLength(256)]),
			description: new UntypedFormControl(this.groupDetails.group?.description || '', [Validators.maxLength(1024)]),
		});
	}

	save() {
		if (!this.groupForm.valid) {
			this.groupForm.markAsDirty();
			return;
		}
		if (this.groupDetails.group) {
			this._groupsManagementService.update(this.groupDetails.group.id, {
				name: this.groupForm.value.name,
				description: this.groupForm.value.description,
			});
		} else {
			const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
			if (!ownerId) {
				console.warn('No owner id at saving...');
				return;
			}

			const newGroupId = uuidv4();
			const newGroup: Group = {
				id: newGroupId,
				name: this.groupForm.value.name,
				description: this.groupForm.value.description,
				kind: this.groupDetails.kind ?? 'team',
				// children: [],
			};
			this._groupsManagementService.add(newGroup);

			if (this.groupDetails.parent) {
				this._groupsManagementService
					.get$(newGroupId)
					.pipe(
						filter((group) => group?.toSync === false),
						tap((group) => {
							console.log('group is now synced, we can add parent', group);
							if (this.groupDetails.parent)
								this._groupsManagementService.addChildToParent(newGroupId, this.groupDetails.parent.id);
						}),
						take(1)
					)
					.subscribe();
			}
			if (this.groupDetails.preventRedirect) {
				this._dialogRef.close(newGroup);
				return;
			} else if (this.groupDetails.parent) this._router.navigate(['/groups/' + this.groupDetails.parent.id]);
			else this._router.navigate(['/groups/' + newGroupId]);
		}

		this._dialogRef.close();
	}

	delete() {
		const group: Group | undefined = this.groupDetails.group;
		if (!group) return;
		const parents: Group[] = this._groupsManagementService.showableParents(group.id);
		const childrenWithoutOwner: Group[] = this._groupsManagementService.showableChildren(group.id);

		this._notificationService
			.confirm(`Are you sure you want to delete the group: ${group.name} ?`)
			.subscribe((result: boolean) => {
				if (result) {
					if (parents.length) {
						parents?.forEach((parent: Group) => {
							this._groupsManagementService.removeChildFromParent(group.id, parent.id);
						});
					} else if (childrenWithoutOwner.length) {
						childrenWithoutOwner?.forEach((child: Group) => {
							this._notificationService
								.confirm(
									'This group contains one or more nested groups, they will be redefined as independent groups.'
								)
								.subscribe((result) => {
									if (result) {
										this._groupsManagementService.removeChildFromParent(child.id, group.id);
										this._groupsManagementService.delete(group.id);
										this._router.navigate(['groups']);
									}
								});
						});
					} else {
						this._groupsManagementService.delete(group.id);
						if (this._groupsManagementService.groupIsARootGroup(group.id, group.kind)) {
							this._router.navigate(['groups']);
						}
					}

					this._dialogRef.close();
				}
			});
	}

	dismiss() {
		this._dialogRef.close();
	}
}
