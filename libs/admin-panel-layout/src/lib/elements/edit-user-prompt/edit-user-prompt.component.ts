import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { UsersRepository } from '@rumble-pwa/users/state';
import { User } from '@rumble-pwa/users/models';

@Component({
	selector: 'rumble-pwa-edit-user-prompt',
	templateUrl: './edit-user-prompt.component.html',
	styleUrls: ['./edit-user-prompt.component.scss'],
})
export class EditUserPromptComponent {
	userForm: UntypedFormGroup;
	constructor(
		private dialogRef: MatDialogRef<EditUserPromptComponent>,
		private notificationsService: NotificationsService,
		private formBuilder: UntypedFormBuilder,
		private usersRepository: UsersRepository,
		@Inject(MAT_DIALOG_DATA)
		public data: { user: User }
	) {
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this.dialogRef.close();
				}
			});
		});

		this.userForm = this.formBuilder.group({
			email: new UntypedFormControl(data.user.email, Validators.required),
			fullName: new UntypedFormControl(data.user.fullName, Validators.required),
			firstName: new UntypedFormControl(data.user.firstName, Validators.required),
			lastName: new UntypedFormControl(data.user.lastName, Validators.required),
			isTest: new UntypedFormControl(data.user.isTest),
			isSuperuser: new UntypedFormControl(!!data.user.isSuperuser),
			isActive: new UntypedFormControl(data.user.isActive),
			newsletterSubscribed: new UntypedFormControl(data.user.newsletterSubscribed),
			invited: new UntypedFormControl(!!data.user.invited),
			emailValidated: new UntypedFormControl(!!data.user.emailValidated),
			anonymous: new UntypedFormControl(!!data.user.anonymous),
			data: new UntypedFormControl(data.user.data || '{}'),
		});
	}

	onClose() {
		this.dialogRef.close();
	}

	onSubmit() {
		if (!this.userForm.valid) return;
		const newUser: Partial<User> = {
			email: this.userForm.get('email')?.value,
			fullName: this.userForm.get('fullName')?.value,
			firstName: this.userForm.get('firstName')?.value,
			lastName: this.userForm.get('lastName')?.value,
			isTest: this.userForm.get('isTest')?.value,
			isSuperuser: this.userForm.get('isSuperuser')?.value,
			isActive: this.userForm.get('isActive')?.value,
			newsletterSubscribed: this.userForm.get('newsletterSubscribed')?.value,
			invited: this.userForm.get('invited')?.value,
			emailValidated: this.userForm.get('emailValidated')?.value,
			anonymous: this.userForm.get('anonymous')?.value,
			data: this.userForm.get('data')?.value,
		};
		this.usersRepository.updateUser(this.data.user.id, newUser);
		this.notificationsService.success(this.data.user.email + ' has been updated!');
		this.dialogRef.close();
	}
}
