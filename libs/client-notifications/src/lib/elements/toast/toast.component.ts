import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { ToastType } from '../../notifications.service';

@Component({
	selector: 'rumble-pwa-toast',
	templateUrl: './toast.component.html',
	styleUrls: ['./toast.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
	title: string | undefined;
	body: string | undefined;
	kind: ToastType = 'INFO';
	constructor(
		@Inject(MAT_SNACK_BAR_DATA)
		public data: { title?: string; body?: string; kind?: ToastType },
		private snackBarRef: MatSnackBarRef<ToastComponent>
	) {
		this.title = data.title;
		this.body = data.body;
		this.kind = data.kind || 'INFO';
	}

	dismiss() {
		this.snackBarRef.dismiss();
	}
}
