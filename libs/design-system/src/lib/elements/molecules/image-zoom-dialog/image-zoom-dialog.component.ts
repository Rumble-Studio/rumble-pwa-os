import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
	selector: 'rumble-pwa-image-zoom-dialog',
	templateUrl: './image-zoom-dialog.component.html',
	styleUrls: ['./image-zoom-dialog.component.scss'],
})
export class ImageZoomDialogComponent {
	constructor(
		private dialogRef: MatDialogRef<ImageZoomDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { imgSrc: string; title: string }
	) {}

	dismiss() {
		this.dialogRef.close();
	}
}
