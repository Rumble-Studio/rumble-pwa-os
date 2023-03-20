import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DEFAULT_DIALOG_CONFIG } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { VirtualExportRequestData, VirtualExportResult } from '@rumble-pwa/exports/models';
import { VirtualExportRequesterPromptComponent } from '@rumble-pwa/exports/ui';
import { FilesRepository } from '@rumble-pwa/files/state';
import { AnswersManagementService, FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { RecordingSession, RecordingSessionListItem } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { MixEditorPromptComponent } from '@rumble-pwa/mixes/ui';
import { VirtualPlaylist } from '@rumble-pwa/player/services';
import { convertUserToDisplayableName, User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { isEqual } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, map, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-recording-session-list',
	templateUrl: './recording-session-list.component.html',
	styleUrls: ['./recording-session-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordingSessionListComponent
	extends LayoutSizeAndCheck
	implements OnInit, CanCheck, HasLayoutSize, CanBeDebugged
{
	@Input()
	displayFormName = false;
	@Input()
	defaultRecordingSessionName?: string;
	@Input()
	recordingSessions?: RecordingSessionListItem[] = [];
	@Input()
	displayDownloadAllButton = true;

	@Input()
	displayArchivedToggle = true;

	@Input()
	hideAnswersWithoutAudioToggle = true;

	private _displayArchivedSessions = false;
	public get displayArchivedSessions() {
		return this._displayArchivedSessions;
	}
	@Input()
	public set displayArchivedSessions(value) {
		this._displayArchivedSessions = value;
		this.displayArchivedSessionsChange.emit(value);
	}

	private _displaySessionsWithAudioOnly = false;
	public get displaySessionsWithAudioOnly() {
		return this._displaySessionsWithAudioOnly;
	}
	@Input()
	public set displaySessionsWithAudioOnly(value) {
		this._displaySessionsWithAudioOnly = value;
		this.displaySessionsWithAudioOnlyChange.emit(value);
	}

	@Output()
	displayArchivedSessionsChange = new EventEmitter<boolean>();

	@Output()
	displaySessionsWithAudioOnlyChange = new EventEmitter<boolean>();

	@Output()
	navigateTo = new EventEmitter<string>();

	dialog: MatDialogRef<VirtualExportRequesterPromptComponent> | undefined = undefined;

	convertUserToDisplayableName = convertUserToDisplayableName;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _recordingSessionsManagementService: RecordingSessionsManagementService,
		private _usersRepository: UsersRepository,
		private _answersManagementService: AnswersManagementService,
		public filesRepository: FilesRepository,
		private _dialog: MatDialog,
		private _notificationsService: NotificationsService,
		private _mixesManagementService: MixesManagementService,
		private _formsManagementService: FormsManagementService,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// console.log('%cRecordingSessionListComponent.constructor', 'color: #00aa00');
	}

	ngOnInit() {
		this.filesRepository.fetchFromServer();
		this._recordingSessionsManagementService.pullDataOnce();
		this._usersRepository.fetchFromServer();
		this._answersManagementService.pullDataOnce(() => this._check());
	}

	listenTo(recordingSessionId: string) {
		this._recordingSessionsManagementService.listenTo(recordingSessionId, 'rslist-' + recordingSessionId);
	}

	downloadData(recordingSessionId: string) {
		this.downloadRecordingSessions([recordingSessionId]);
	}

	downloadAllData() {
		if (!this.recordingSessions) return;
		const recordingSessionIds = this.recordingSessions?.map((recordingSession) => recordingSession.recordingSession.id);
		this.downloadRecordingSessions(recordingSessionIds);
	}

	downloadRecordingSessions(recordingSessionIds: string[]) {
		const virtualPlaylists$: Observable<VirtualPlaylist | null>[] = recordingSessionIds.map((recordingSessionId) => {
			const virtualPlaylist$: Observable<VirtualPlaylist | null> = this._recordingSessionsManagementService
				.convertRecordingSessionsToVirtualPlaylistData$([recordingSessionId])
				.pipe(
					untilDestroyed(this),
					map((virtualPlaylistData) => virtualPlaylistData.virtualPlaylist)
				);
			return virtualPlaylist$;
		});

		const now = new Date();

		let cachedData = {};

		combineLatest(virtualPlaylists$)
			.pipe(
				map((virtualPlaylists) => {
					return virtualPlaylists.filter((vp): vp is VirtualPlaylist => !!vp);
				}),
				filter((virtualPlaylists) => {
					return virtualPlaylists.every((virtualPlaylist) => {
						return virtualPlaylist.virtualTracks.length > 0;
					});
				}),
				debounceTime(100),
				map((virtualPlaylists) => {
					const durationTotal = recordingSessionIds.reduce((duration, recordingSessionId) => {
						const durationSession = this._recordingSessionsManagementService.getRecordingSessionDuration(
							recordingSessionId,
							true
						);
						return duration + durationSession;
					}, 0);

					const data = {
						virtualPlaylists: virtualPlaylists,
						exportName: (this.defaultRecordingSessionName ?? 'Exports') + ' ' + now.toLocaleDateString(),
						estimatedExportDuration: durationTotal,
						displayMixWarning: true,
					};

					return data;
				}),
				filter((data) => !isEqual(data, cachedData)),
				switchMap((data) => {
					cachedData = data;
					this.dialog?.close();
					this.dialog = this._dialog.open<
						VirtualExportRequesterPromptComponent,
						VirtualExportRequestData,
						VirtualExportResult
					>(VirtualExportRequesterPromptComponent, {
						...DEFAULT_DIALOG_CONFIG,
						data,
					});
					return this.dialog.afterClosed().pipe(
						tap((result) => {
							console.log('result virtual export prompt: ', result);
						})
					);
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	openCreateMixFromRecordingSessionModal(recordingSessionListItem: RecordingSessionListItem) {
		const now = new Date();
		this._dialog.open(MixEditorPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: {
				mix: undefined,
				recordingSessionListItem,
				newMixName:
					recordingSessionListItem.user.fullName +
					' - ' +
					(recordingSessionListItem.form.title ?? 'interview') +
					' - ' +
					now.toLocaleDateString(),
			},
		});
	}

	deleteRecordingSession(recordingSession: RecordingSession) {
		this._notificationsService.confirm().subscribe((result) => {
			if (result) {
				this._recordingSessionsManagementService.delete(recordingSession.id);
				this._check();
			}
		});
	}

	archiveRecordingSession(recordingSession: RecordingSession) {
		this._notificationsService.confirm().subscribe((result) => {
			if (result) {
				this._recordingSessionsManagementService.archive(recordingSession.id);
				this._check();
			}
		});
	}

	restoreRecordingSession(recordingSession: RecordingSession) {
		this._recordingSessionsManagementService.restore(recordingSession.id);
		this._notificationsService.success('Your session has been restored');
		this._check();
	}

	goToShareTab() {
		this.navigateTo.emit('invite');
	}

	public getUserAvatar(user?: User) {
		return this._usersRepository.getUserAvatar(user);
	}

	public convertObjectToSortableElement(object: RecordingSessionListItem, propertyNameAsString: string) {
		if (propertyNameAsString === 'formName') {
			return object.form.title ?? '';
		}
		if (propertyNameAsString === 'participant') {
			return object.user.fullName;
		}
		if (propertyNameAsString === 'timeUpdate') {
			return object.recordingSession.timeUpdate ?? 0;
		}
		if (propertyNameAsString === 'answer-duration') {
			return object.duration ?? 0;
		}

		if (!(propertyNameAsString in object)) {
			// return
			throw new Error(`Could not find property ${propertyNameAsString} in object`);
		}

		const propertyName = propertyNameAsString as keyof RecordingSessionListItem;

		if (typeof object[propertyName] === 'string') {
			return (object[propertyName] as unknown as string).toLowerCase();
		}
		if (typeof object[propertyName] === 'number') {
			return object[propertyName] as unknown as number;
		}
		return object[propertyName] ? 1 : 0;
	}

	public convertObjectToSearchableString(object: RecordingSessionListItem): string {
		const searchableString = JSON.stringify(object);
		return searchableString;
	}

	public exportToCSV(recordingSession: RecordingSession) {
		const user = this._usersRepository.get(recordingSession.ownerId);
		const form = this._formsManagementService.get(recordingSession.formId);
		const exportName = form?.title + '-' + user?.email + '-export.csv';
		this._recordingSessionsManagementService.exportRecordingSessionsToCSV([recordingSession.id], exportName);
	}

	public exportAllToCSV() {
		if (!this.recordingSessions) return;
		const recordingSessionIds = this.recordingSessions.map((recSes) => recSes.recordingSession.id);
		this._recordingSessionsManagementService.exportRecordingSessionsToCSV(recordingSessionIds);
	}

	public exportToDOCX(recordingSession: RecordingSession) {
		const user = this._usersRepository.get(recordingSession.ownerId);
		const form = this._formsManagementService.get(recordingSession.formId);
		const exportName = form?.title + '-' + user?.email + '-export.docx';
		this._recordingSessionsManagementService.exportRecordingSessionsToDOCX([recordingSession.id], exportName);
	}

	public exportAllToDOCX() {
		if (!this.recordingSessions) return;
		const recordingSessionIds = this.recordingSessions.map((recSes) => recSes.recordingSession.id);
		this._recordingSessionsManagementService.exportRecordingSessionsToDOCX(recordingSessionIds);
	}
}
