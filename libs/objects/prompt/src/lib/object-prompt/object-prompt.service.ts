import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { ModalStyle, ObjectDetails, ObjectPromptComponent } from './object-prompt.component';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class ObjectPromptService {
	constructor(private _dialog: MatDialog) {}

	openObjectPromptModal$<T>(objectDetails: ObjectDetails<T>, style?: ModalStyle): Observable<Partial<T> | undefined> {
		const dialogRef: MatDialogRef<ObjectPromptComponent<T>, Partial<T>> = this._dialog.open(ObjectPromptComponent<T>, {
			width: '95%',
			maxHeight: '95%',
			maxWidth: '100%',
			...style,
			data: objectDetails,
			panelClass: 'rs-object-prompt-modal',
		});
		return dialogRef.afterClosed();
	}
}
