import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';

export interface TextRequesterPromptData {
	title?: string;
	textFieldLabel?: string;
}

@Component({
	selector: 'rumble-pwa-text-requester-prompt',
	templateUrl: './text-requester-prompt.component.html',
	styleUrls: ['./text-requester-prompt.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		MatFormFieldModule,
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatDialogModule,
		MatIconModule,
		MatInputModule,
		TrackClickDirective,
	],
})
export class TextRequesterPromptComponent {
	textForm: FormGroup;
	constructor(
		private _dialogRef: MatDialogRef<TextRequesterPromptComponent, string>,
		private _formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public data: TextRequesterPromptData
	) {
		this.textForm = this._formBuilder.group({
			text: new FormControl(undefined, Validators.required),
		});
	}

	close(text?: string) {
		this._dialogRef.close(text);
	}

	save() {
		if (!this.textForm.valid) return;
		const text = this.textForm.get('text')?.value;
		this.close(text);
	}
}
