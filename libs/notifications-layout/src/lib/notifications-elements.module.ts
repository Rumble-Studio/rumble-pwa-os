import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { UtilsModule } from '@rumble-pwa/utils';
import { NotificationItemComponent } from './elements/notification-item/notification-item.component';
import { NotificationListComponent } from './elements/notification-list/notification-list.component';
import { NotificationPreviewComponent } from './elements/notification-preview/notification-preview.component';

const COMPONENTS = [NotificationListComponent, NotificationItemComponent, NotificationPreviewComponent];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule,
		DesignSystemModule,
		UtilsModule,
		TrackClickDirective,
	],
	declarations: COMPONENTS,
	exports: COMPONENTS,
})
export class NotificationsElementsModule {}
