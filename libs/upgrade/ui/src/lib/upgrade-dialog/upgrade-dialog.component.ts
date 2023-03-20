import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Upgrade } from '@rumble-pwa/upgrade/models';

@Component({
	selector: 'rumble-pwa-upgrade-dialog',
	templateUrl: './upgrade-dialog.component.html',
	styleUrls: ['./upgrade-dialog.component.scss'],
	imports: [MatButtonModule],
	standalone: true,
})
export class UpgradeDialogComponent {
	dismissTerm = 'Later';
	upgradeTerm = 'See plans';

	upgrade: Upgrade;
	constructor(
		private dialogRef: MatDialogRef<UpgradeDialogComponent, boolean>,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			upgrade: Upgrade;
		}
	) {
		this.upgrade = data.upgrade;
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.dialogRef.close(false);
		});
	}

	dismiss() {
		this.dialogRef.close(false);
	}

	goBilling() {
		this.dialogRef.close(true);
	}
}
