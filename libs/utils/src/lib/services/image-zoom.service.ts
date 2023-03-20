import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageZoomDialogComponent } from '@rumble-pwa/design-system';

@Injectable({
	providedIn: 'root',
})
export class ImageZoomService {
	constructor(private dialog: MatDialog) {}

	zoomImage(imgSrc: string, title: string = '') {
		this.dialog.open(ImageZoomDialogComponent, {
			maxHeight: '90vh',
			maxWidth: '90%',
			data: { imgSrc, title },
		});
	}
}
