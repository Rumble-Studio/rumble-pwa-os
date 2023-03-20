import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
	selector: 'rumble-pwa-permanent-dialog',
	templateUrl: './permanent-dialog.component.html',
	styleUrls: ['./permanent-dialog.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermanentDialogComponent {
	constructor(private dialogRef: MatDialogRef<PermanentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

	dismiss() {
		this.dialogRef.close();
	}

	processClick() {
		this.dismiss();
	}
}
