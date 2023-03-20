import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { Notification } from '@rumble-pwa/mega-store';
import { NotificationsManagementService } from '@rumble-pwa/notifications-system';
import { DataObsViaId, getRouteParam$, LayoutService } from '@rumble-pwa/utils';
import { filter, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-notification-page',
	templateUrl: './notification-page.component.html',
	styleUrls: ['./notification-page.component.scss'],
})
export class NotificationPageComponent {
	notification$$$ = new DataObsViaId<Notification>((notificationId: string) =>
		this.notificationsManagementService.get$(notificationId)
	);
	layoutSize = 0;
	notifications: Notification[] = [];

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;

	constructor(
		private notificationsManagementService: NotificationsManagementService,
		private activatedRoute: ActivatedRoute,
		private layoutService: LayoutService,
		private cdr: ChangeDetectorRef,
		private _router: Router,
		private _layoutRepository: LayoutRepository
	) {
		getRouteParam$(this.activatedRoute, 'notificationId')
			.pipe(
				untilDestroyed(this),
				tap((notificationId) => {
					this.notification$$$.id = notificationId;
					this.check();
				})
			)
			.subscribe();

		this.layoutService.layoutSize$
			.pipe(
				untilDestroyed(this),
				filter((layoutSize) => this.layoutSize !== layoutSize)
			)
			.subscribe((layoutSize) => {
				this.layoutSize = layoutSize;
				this.check();
			});

		this.notificationsManagementService
			.getAll$()
			.pipe(untilDestroyed(this))
			.subscribe((notifications) => {
				this.notifications = notifications;
			});

		this.notification$$$.$.pipe(
			untilDestroyed(this),
			tap((notification) => {
				if (!notification) return;
				this.notificationsManagementService.toggleHasSeen(notification.id, true);
				this._layoutRepository.setLayoutProps({
					...LAYOUT_FOR_ITEM,
					pageSegments: [
						HOME_SEGMENT,
						{
							title: 'Notifications',
							link: '/notifications',
						},
						{
							title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
							eventName: 'display-other-notifications-menu',
						},
						{
							title: notification.title ?? 'Notification',
						},
					],
				});
			})
		).subscribe();

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'display-other-notifications-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	selectNotification(notification: Notification) {
		this._router.navigate(['/dashboard', 'notifications', notification.id]);
	}

	private check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
