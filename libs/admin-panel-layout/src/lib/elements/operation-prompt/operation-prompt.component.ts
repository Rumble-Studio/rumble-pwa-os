import { User, UserData, convertUserToDisplayableName } from '@rumble-pwa/users/models';
import { Attr, AttrElement } from '@rumble-pwa/utils';
import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupsManagementService, OperationsManagementService } from '@rumble-pwa/groups-system';
import { Group, Operation } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface OperationDetails {
	operation?: Operation;
}

@Component({
	selector: 'rumble-pwa-operation-prompt',
	templateUrl: './operation-prompt.component.html',
	styleUrls: ['./operation-prompt.component.scss'],
})
export class OperationPromptComponent {
	operationForm: UntypedFormGroup;
	groups$$: BehaviorSubject<Group[]>;

	constructor(
		private dialogRef: MatDialogRef<OperationPromptComponent>,
		private operationsManagementService: OperationsManagementService,
		private groupsManagementService: GroupsManagementService,
		private usersRepository: UsersRepository,

		private formBuilder: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA) public operationDetails?: OperationDetails
	) {
		this.groups$$ = this.groupsManagementService.groups$$;
		this.operationForm = this.formBuilder.group({
			name: new UntypedFormControl(operationDetails?.operation?.name, Validators.required),
			description: new UntypedFormControl(operationDetails?.operation?.description),
			kind: new UntypedFormControl(operationDetails?.operation?.kind, Validators.required),
			details: new UntypedFormControl(operationDetails?.operation?.details),
			key: new UntypedFormControl(operationDetails?.operation?.key, Validators.required),
			groupId: new UntypedFormControl(operationDetails?.operation?.groupId),
		});
	}

	save() {
		if (!this.operationForm.valid) {
			this.operationForm.controls['name'].markAsTouched();
			this.operationForm.controls['kind'].markAsTouched();
			this.operationForm.controls['key'].markAsTouched();
			return;
		}
		if (this.operationDetails?.operation) {
			this.operationsManagementService.update(this.operationDetails?.operation.id, {
				name: this.operationForm.get('name')?.value,
				description: this.operationForm.get('description')?.value,
				kind: this.operationForm.get('kind')?.value,
				details: this.operationForm.get('details')?.value,
				key: this.operationForm.get('key')?.value,
				groupId: this.operationForm.get('groupId')?.value,
			});
		} else {
			const newOperationId = uuidv4();
			const ownerId = this.usersRepository.connectedUser$$.value?.id;
			if (!ownerId) {
				console.warn('No owner id at saving...');
				return;
			}
			// todo: change who owns operation
			const newOperation: Operation = {
				id: newOperationId,
				ownerId,
				name: this.operationForm.get('name')?.value,
				description: this.operationForm.get('description')?.value,
				kind: this.operationForm.get('kind')?.value,
				details: this.operationForm.get('details')?.value,
				key: this.operationForm.get('key')?.value,
				groupId: this.operationForm.get('groupId')?.value,
			};
			this.operationsManagementService.add(newOperation);
		}
		this.dialogRef.close();
	}

	delete() {
		if (this.operationDetails?.operation) this.operationsManagementService.delete(this.operationDetails?.operation.id);
		this.dialogRef.close();
	}
	dismiss() {
		this.dialogRef.close();
	}
}
