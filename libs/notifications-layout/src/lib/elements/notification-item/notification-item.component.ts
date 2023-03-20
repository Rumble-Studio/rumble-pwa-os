import { Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Notification } from '@rumble-pwa/mega-store';
import { NotificationsManagementService } from '@rumble-pwa/notifications-system';
import { DataObsViaId } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-notification-item',
	templateUrl: './notification-item.component.html',
	styleUrls: ['./notification-item.component.scss'],
})
export class NotificationItemComponent {
	notification$$$ = new DataObsViaId<Notification>((notificationId) =>
		this._notificationsManagementService.get$(notificationId)
	);
	notifications: Notification[] = [];

	_notificationId?: string;
	@Input()
	public set notificationId(v) {
		this._notificationId = v;
		this.notification$$$.id = v;
	}
	public get notificationId() {
		return this._notificationId;
	}

	constructor(private _notificationsManagementService: NotificationsManagementService) {
		this.notification$$$.$.pipe(
			untilDestroyed(this),
			tap((notification) => {
				if (!notification) return;
				this._notificationsManagementService.toggleHasSeen(notification.id, true);
			})
		).subscribe();
	}

	/**
	 * Reproduce the action that this notication should do
	 * @param notification
	 */
	public triggerAction(notification: Notification) {
		this._notificationsManagementService.processNotificationClick(notification);
	}
}
