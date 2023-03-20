import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { NotificationsElementsModule } from './notifications-elements.module';
import { NotificationListPageComponent } from './pages/notification-list-page/notification-list-page.component';
import { NotificationPageComponent } from './pages/notification-page/notification-page.component';

const routes = [
	{
		path: '',
		component: NotificationListPageComponent,
	},
	{
		path: ':notificationId',
		component: NotificationPageComponent,
	},
];
@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
		NotificationsElementsModule,
		TrackClickDirective,
	],
	declarations: [NotificationListPageComponent, NotificationPageComponent],
})
export class NotificationsLayoutModule {}
