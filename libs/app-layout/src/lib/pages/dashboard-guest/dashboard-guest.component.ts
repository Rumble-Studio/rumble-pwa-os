import { ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { LayoutRepository } from '@rumble-pwa/layout/state';
import { RecordingSessionListItem } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	HasLayoutSize,
	JavascriptService,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { combineLatest } from 'rxjs';
import { debounceTime, startWith, switchMap, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-dashboard-guest',
	templateUrl: './dashboard-guest.component.html',
	styleUrls: ['./dashboard-guest.component.scss'],
})
export class DashboardGuestComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	lastOwnedRecordingSessions: RecordingSessionListItem[] = [];
	cnamed = !(window.location.origin.includes('localhost') || window.location.origin.includes('app.rumble.studio'));
	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		public dialog: MatDialog,
		private _usersRepository: UsersRepository,
		private _recordingSessionsManagementService: RecordingSessionsManagementService,
		private _router: Router,
		private _layoutRepository: LayoutRepository,
		private _notificationsService: NotificationsService,
		private _javascriptService: JavascriptService
	) {
		super(_cdr, _layoutService, _activateRoute);

		selectPersistStateInit()
			.pipe(
				untilDestroyed(this),
				take(1),
				tap(() => {
					// fill last owned recording sessions and last guests
					combineLatest([
						this._recordingSessionsManagementService.recordingSessions$$,
						this._usersRepository.connectedUser$$,
					])
						.pipe(
							switchMap(([recordingSessions]) => {
								return combineLatest(
									recordingSessions.map((recordingSession) =>
										this._recordingSessionsManagementService
											.getRecordingSessionListItem$(recordingSession.id)
											.pipe(startWith(null))
									)
								);
							}),
							untilDestroyed(this),
							debounceTime(200),
							tap((recordingSessionItems) => {
								this.lastOwnedRecordingSessions = sortBy(
									recordingSessionItems
										.filter((child): child is RecordingSessionListItem => !!child)
										.filter(
											(recordingSessionListItem) =>
												recordingSessionListItem.form.ownerId !==
													this._usersRepository.connectedUser$$.getValue()?.id &&
												recordingSessionListItem.user.id ==
													this._usersRepository.connectedUser$$.getValue()?.id &&
												recordingSessionListItem.recordingSession.state === 'default' &&
												recordingSessionListItem.form.state === 'default'
										)
										.map((recordingSessionListItem) => {
											const recordingSessionItemWithDuration: RecordingSessionListItem = {
												...recordingSessionListItem,
												duration: this._recordingSessionsManagementService.getRecordingSessionDuration(
													recordingSessionListItem.recordingSession.id
												),
											};
											return recordingSessionItemWithDuration;
										}),
									'recordingSession.timeCreation'
								).reverse();
								this._check();
							})
						)
						.subscribe();
				})
			)
			.subscribe();

		this._layoutRepository.setLayoutProps({
			displayHeader: false,
			displayBurgerMenu: false,
			displayFooter: false,
			displaySidebarLeft: false,
			displayGlobalPlayer: false,
			displaySidebarRight: false,
			loading: false,
			pageSegments: [],
			displayLogo: true,
		});

		this._javascriptService.loadScript('hubspot-script', '//js-eu1.hs-scripts.com/24940985.js', () => {
			console.log('hubspot script loaded');
		});
	}

	public listenTo(recordingSessionId: string) {
		this._recordingSessionsManagementService.listenTo(recordingSessionId, 'welcome' + recordingSessionId);
	}

	public goToLink(url: string) {
		window.open(url, '_blank');
	}

	public activateCreatorDashboard() {
		const isGuestOnly = !!this._usersRepository.connectedUser$$.value?.isGuestOnly;
		if (isGuestOnly)
			this._notificationsService
				.confirm(
					'Activate Creator features',
					'Are you sure to activate the Creator features? This change will be permanent (nothing to worry about: your guest answers will still be available).'
				)
				.subscribe((confirmation) => {
					if (confirmation) {
						this._usersRepository.updateConnectedUser({
							isGuestOnly: false,
						});
						this._router.navigate(['/']);
					}
				});
		else this._router.navigate(['/']);
	}
}
