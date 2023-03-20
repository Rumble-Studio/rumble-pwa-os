import { Component, Input } from '@angular/core';
import { Notification } from '@rumble-pwa/mega-store';
import { NotificationsManagementService } from '@rumble-pwa/notifications-system';

@Component({
	selector: 'rumble-pwa-notification-preview',
	templateUrl: './notification-preview.component.html',
	styleUrls: ['./notification-preview.component.scss'],
})
export class NotificationPreviewComponent {
	_notification?: Notification;
	@Input()
	public set notification(v) {
		this._notification = v;
		if (!v) return;
		const timeNow = Math.floor(Date.now() / 1000);
		const recentThreshold = 60 * 20; // in seconds
		const isRecentFromTimeCreation = timeNow - (v.timeCreation || 0) < recentThreshold;
		const isRecentFromTimeUpdate = timeNow - (v.timeUpdate || 0) < recentThreshold;
		this.isRecent = isRecentFromTimeCreation || isRecentFromTimeUpdate;
		this.notificationIcon = this.notificationsManagementService.getNotificationIcon(v);
	}
	public get notification() {
		return this._notification;
	}

	@Input() profileId?: string;

	isRecent = false;
	notificationIcon?: string;

	constructor(private notificationsManagementService: NotificationsManagementService) {}
}
