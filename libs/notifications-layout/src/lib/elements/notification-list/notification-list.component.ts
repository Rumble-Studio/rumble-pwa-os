import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Notification } from '@rumble-pwa/mega-store';
import { NotificationsManagementService } from '@rumble-pwa/notifications-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { tap } from 'rxjs/operators';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-notification-list',
	templateUrl: './notification-list.component.html',
	styleUrls: ['./notification-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent {
	private _notifications: Notification[] = [];
	public get notifications(): Notification[] {
		return this._notifications;
	}

	@Input()
	public set notifications(value: Notification[]) {
		this._notifications = value;
		this.dataSource = new MatTableDataSource(value);
		this.setDataSourceParameters();
	}

	_layoutSize = 2;
	@Input()
	public set layoutSize(v) {
		this._layoutSize = v;
		if (v < 1) {
			this.displayedColumns = ['title', 'description', 'options'];
		} else {
			this.displayedColumns = ['checkbox', 'title', 'description', 'timeCreation', 'options'];
		}
	}
	public get layoutSize() {
		return this._layoutSize;
	}

	displayedColumns: string[] = ['title', 'description', 'timeCreation', 'options'];

	dataSource: MatTableDataSource<Notification> = new MatTableDataSource([] as Notification[]);

	_paginator!: MatPaginator;
	@ViewChild(MatPaginator)
	set paginator(newPaginator: MatPaginator) {
		if (newPaginator === this._paginator) return;
		this._paginator = newPaginator;
		this.setDataSourceParameters();
	}
	get paginator() {
		return this._paginator;
	}

	_sort!: MatSort;
	@ViewChild(MatSort)
	set sort(newSort: MatSort) {
		if (newSort == this._sort) return;
		this._sort = newSort;
		this.setDataSourceParameters();
	}
	get sort() {
		return this._sort;
	}

	userId?: string;
	notificationIdsChecked: string[] = [];

	constructor(
		private cdr: ChangeDetectorRef,
		public dialog: MatDialog,
		private notificationsManagementService: NotificationsManagementService,
		private usersRepository: UsersRepository,
		private _layoutRepository: LayoutRepository
	) {
		this.usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((connectedUser) => {
					this.userId = connectedUser?.id;
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Notifications',
				},
			],
		});
	}

	ngAfterViewInit() {
		this.setDataSourceParameters();
	}

	applyFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	setDataSourceParameters() {
		// paginator
		this.dataSource.paginator = this.paginator;

		// sort
		this.dataSource.sort = this.sort;

		// filter predicate
		this.dataSource.filterPredicate = (notification: Notification, filter: string) =>
			(notification.title.toLowerCase() + notification.description?.toLowerCase()).indexOf(filter.toLowerCase()) != -1;

		// sorting accessor
		this.dataSource.sortingDataAccessor = (notification: Notification, propertyNameAsString: string) => {
			const propertyName = propertyNameAsString as keyof Notification;
			if (typeof notification[propertyName] === 'string') {
				return (notification[propertyName] as string).toLowerCase();
			}
			if (typeof notification[propertyName] === 'number') {
				return notification[propertyName] as number;
			}
			return notification[propertyName] ? 1 : 0;
		};
		this._check();
	}

	toggleSeen(notification: Notification) {
		if (!this.userId) return;
		const hasSeen = notification.hasSeenByIds[this.userId];
		this.notificationsManagementService.toggleHasSeen(notification.id, !hasSeen);
	}

	archive(notification: Notification) {
		this.notificationsManagementService.archive(notification.id);
	}

	archiveAll() {
		this.notificationIdsChecked.forEach((notificationId) => {
			this.notificationsManagementService.archive(notificationId);
		});
		this.notificationIdsChecked = [];
	}

	toggleSeenAll(seen: boolean) {
		this.notificationIdsChecked.forEach((notificationId) => {
			const notification = this.notifications.find((notification) => notification.id === notificationId);
			if (!notification || !this.userId) return;
			this.notificationsManagementService.toggleHasSeen(notificationId, seen);
		});
		this.notificationIdsChecked = [];
	}

	notificationsCheckedUpdate(notificationId: string, checked: boolean) {
		const isAlreadyChecked = this.notificationIdsChecked.includes(notificationId);

		if (checked && !isAlreadyChecked) this.notificationIdsChecked.push(notificationId);
		if (!checked && isAlreadyChecked)
			this.notificationIdsChecked.splice(this.notificationIdsChecked.indexOf(notificationId, 0), 1);
	}

	notificationsCheckedAllUpdate(checked: boolean) {
		if (checked) this.notificationIdsChecked = this.notifications.map((notification) => notification.id);
		if (!checked) this.notificationIdsChecked = [];
	}

	getNotificationIcon(notification: Notification) {
		return this.notificationsManagementService.getNotificationIcon(notification);
	}
	private _check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
