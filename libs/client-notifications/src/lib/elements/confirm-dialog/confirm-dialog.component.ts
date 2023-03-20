import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { tap } from 'rxjs/operators';
import { ConfirmType } from '../../notifications.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';

function cleaner(text: string) {
	return text.trim().toLowerCase().replace(/'|"/g, '');
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-confirm-dialog',
	templateUrl: './confirm-dialog.component.html',
	styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
	textConfirmForm?: FormGroup;

	constructor(
		private _dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
		private _formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			title?: string;
			subtitle?: string;
			cancelTerm?: string;
			confirmTerm?: string;
			kind: ConfirmType;
			textForConfirmation?: string;
		}
	) {
		const textForConfirmation = data.textForConfirmation;
		if (textForConfirmation) {
			this.textConfirmForm = this._formBuilder.group({
				text: new FormControl(''),
			});

			const textForConfirmationControl = this.textConfirmForm.get('text') as AbstractControl<string>;
			textForConfirmationControl.valueChanges
				.pipe(
					untilDestroyed(this),
					tap(() => {
						// trim, lowercase and replacement of useless " or '
						const currentValue = cleaner(textForConfirmationControl.value);
						const valueToMatch = cleaner(textForConfirmation);

						if (currentValue !== valueToMatch) {
							const errors = {
								confirmationDoesNotMatch: { message: 'Check your input' },
							};
							textForConfirmationControl.setErrors(errors);
						}
					})
				)
				.subscribe();
		}
	}

	close(confirm?: boolean) {
		this._dialogRef.close(confirm);
	}

	cancel() {
		this.close(false);
	}

	confirm() {
		if (
			this.data.textForConfirmation &&
			this.textConfirmForm &&
			cleaner(this.data.textForConfirmation) !== cleaner(this.textConfirmForm.get('text')?.value)
		) {
			return;
		}
		this.close(true);
	}
}
