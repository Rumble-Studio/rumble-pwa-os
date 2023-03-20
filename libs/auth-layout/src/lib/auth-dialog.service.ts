import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthDialogComponent, AuthDialogData } from './elements/auth-dialog/auth-dialog.component';

@Injectable({
	providedIn: 'root',
})
export class AuthDialogService {
	constructor(private matDialog: MatDialog) {}

	openAuthDialog(data?: AuthDialogData): MatDialogRef<AuthDialogComponent, boolean> {
		return this.matDialog.open<AuthDialogComponent, AuthDialogData, boolean>(AuthDialogComponent, {
			width: '90%',
			maxWidth: '400px',
			data,
			panelClass: 'authDialog',
		});
	}
}
