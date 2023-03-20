import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { convertFontLabelToFontValue } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';

@Component({
	selector: 'rumble-pwa-fonts-prompt',
	templateUrl: './fonts-prompt.component.html',
	styleUrls: ['./fonts-prompt.component.scss'],
	standalone: true,
	imports: [MatFormFieldModule, CommonModule, MatOptionModule, MatSelectModule, MatButtonModule, TrackClickDirective],
})
export class FontsPromptComponent {
	selectedFont? = this.data.fonts[0].label;
	getFontStyle = convertFontLabelToFontValue;

	constructor(
		private dialogRef: MatDialogRef<FontsPromptComponent>,
		@Inject(MAT_DIALOG_DATA)
		public data: { fonts: [{ label: string; value: string }] }
	) {}

	onClose() {
		this.dialogRef.close();
	}

	onSave() {
		this.dialogRef.close(this.selectedFont);
	}
}
