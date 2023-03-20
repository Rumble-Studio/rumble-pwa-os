import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrokerService, BROKE_OPTIONS } from '@rumble-pwa/broker-system';
import confetti from 'canvas-confetti';
import { map, take } from 'rxjs/operators';
import { ConfirmDialogComponent } from './elements/confirm-dialog/confirm-dialog.component';
import { PermanentDialogComponent } from './elements/permanent-dialog/permanent-dialog.component';
import { ToastComponent } from './elements/toast/toast.component';

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
export type ConfirmType = 'CONFIRM';

@Injectable({
	providedIn: 'root',
})
export class NotificationsService {
	permanentDialogRef?: MatDialogRef<PermanentDialogComponent>;
	celebrationCounter = 0;
	constructor(private snackBarService: MatSnackBar, private matDialog: MatDialog, private brokerService: BrokerService) {
		this.brokerService.broker$.subscribe((brokeMessage) => {
			if (brokeMessage === BROKE_OPTIONS.celebrate) {
				this.celebrate();

				this.celebrationCounter++;
				if (this.celebrationCounter == 3) {
					this.info('You look like a happy person!');
				}
				if (this.celebrationCounter == 5) {
					window.open('https://youtu.be/3GwjfUFyY6M?t=8', '_blank');
				}
				if (this.celebrationCounter == 15) {
					this.warning('Too much happiness, you should start a podcast my friend!');
					setTimeout(() => {
						window.open('https://rumble.studio', '_blank');
					}, 5000);
				}
			} else if (brokeMessage === BROKE_OPTIONS.celebrateReset) {
				this.celebrationCounter = 0;
				this.celebrate();
			} else if (brokeMessage === BROKE_OPTIONS.rr) {
				this.openRR();
			}
		});
	}

	openRR() {
		this.confirm('undefined', 'undefined').subscribe((v) => {
			// if (v) {
			window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
			// }
		});
	}

	warning(msg: string, title = '', extra?: unknown, snack = true, duration = 5000) {
		console.log('%cWARNING', 'color:goldenrod', title ? '[' + title + ']' : '', msg, extra);

		if (snack) this.openSnackBar(title, msg, duration, 'WARNING');
	}

	success(msg: string, title = '', extra?: unknown, snack = true, duration = 5000) {
		console.log('%cSUCCESS', 'color:green', title ? '[' + title + ']' : '', msg, extra);

		if (snack) this.openSnackBar(title, msg, duration, 'SUCCESS');
	}
	info(msg: string, title = '', extra?: unknown, snack = true, duration = 5000) {
		console.log('%cINFO', 'color:blue', title ? '[' + title + ']' : '', msg, extra);

		if (snack) this.openSnackBar(title, msg, duration, 'INFO');
	}

	error(msg: string, title = '', extra?: unknown, snack = true, duration = 15000) {
		console.error('%cERROR', 'color:red', title ? '[' + title + ']' : '', msg, extra);

		if (snack) this.openSnackBar(title, msg, duration, 'ERROR');
	}

	openSnackBar(title?: string, body?: string, duration = 50000, kind: ToastType = 'INFO') {
		this.snackBarService.openFromComponent(ToastComponent, {
			duration,
			data: { title, body },
			panelClass: kind as string,
			verticalPosition: 'top',
		});
	}

	confirmWithInput(
		title: string | undefined = 'Are you sure?',
		subtitle: string | undefined = '',
		textForConfirmation: string = 'delete',
		cancelTerm: string | undefined = 'Cancel',
		confirmTerm: string | undefined = 'Confirm',
		kind: ConfirmType = 'CONFIRM'
	) {
		return this.confirm(title, subtitle, cancelTerm, confirmTerm, kind, textForConfirmation);
	}

	confirm(
		title: string | undefined = 'Are you sure?',
		subtitle: string | undefined = '',
		cancelTerm: string | undefined = 'Cancel',
		confirmTerm: string | undefined = 'Confirm',
		kind: ConfirmType = 'CONFIRM',
		textForConfirmation?: string
	) {
		return this.matDialog
			.open(ConfirmDialogComponent, {
				// height: '90%',
				width: '90%',
				maxWidth: '500px',
				// minHeight: '200px',
				data: {
					title,
					subtitle,
					cancelTerm,
					confirmTerm,
					kind,
					textForConfirmation,
				},
			})
			.afterClosed()
			.pipe(
				map((v) => !!v),
				take(1)
			);
	}

	permanentDialog() {
		this.closePermanentDialog();

		this.permanentDialogRef = this.matDialog.open(PermanentDialogComponent, {
			autoFocus: false,
			hasBackdrop: false,
			data: { dummy: 'foobar' },
			panelClass: 'permanentDialog',
		});

		return this.permanentDialogRef.afterClosed().pipe(
			map((v) => !!v),
			take(1)
		);
	}

	closePermanentDialog() {
		if (this.permanentDialogRef) this.permanentDialogRef.close();
		this.permanentDialogRef = undefined;
	}

	celebrate() {
		confetti();
	}
}
