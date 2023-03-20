import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from './notifications.service';
import { ToastComponent } from './elements/toast/toast.component';
import { ConfirmDialogComponent } from './elements/confirm-dialog/confirm-dialog.component';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { PermanentDialogComponent } from './elements/permanent-dialog/permanent-dialog.component';

const COMPONENTS = [ToastComponent, ConfirmDialogComponent, PermanentDialogComponent];

@NgModule({
	imports: [CommonModule, DesignSystemModule],
	providers: [NotificationsService],
	declarations: COMPONENTS,
	exports: COMPONENTS,
})
export class ClientNotificationsModule {}
