import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DownloaderComponent } from '@rumble-pwa/atomic-system';
import { EntityExport, ExportResultData, VirtualExportRequestData } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Task } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import {
	VirtualPlayerService,
	VirtualPlaylist,
	VirtualPlaylistWithStreamStates,
	VirtualTrack,
} from '@rumble-pwa/player/services';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { TasksManagementService } from '@rumble-pwa/tasks-system';
import { CanBeDebugged, CanCheck, DataObsViaId, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { combineLatest, Observable, of } from 'rxjs';
import { finalize, map, startWith, switchMap, tap } from 'rxjs/operators';

const ExportItemIdPrefix = 'ei-';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'rumble-pwa-export-item',
	standalone: true,
	imports: [
		CommonModule,
		VirtualPlaylistComponent,
		DownloaderComponent,
		MatProgressSpinnerModule,
		MatButtonModule,
		RouterModule,
		MatIconModule,
		TrackClickDirective,
	],
	templateUrl: './export-item.component.html',
	styleUrls: ['./export-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportItemComponent
	extends LayoutSizeAndCheck
	implements CanBeDebugged, HasLayoutSize, CanCheck, OnDestroy, OnInit
{
	entityExport$$$ = new DataObsViaId<EntityExport>(
		(objectId: string) => this._exportsRepository.get$(objectId)
		// .pipe
		// tap(() => {
		// 	if (this.task?.id) this._TasksManagementService.pullTaskByIdOnce(this.task?.id);
		// })
		// ()
	);
	public get objectId() {
		return this.entityExport$$$.id;
	}
	@Input()
	public set objectId(newObjectId) {
		this.entityExport$$$.id = newObjectId;
	}

	task$$$ = new DataObsViaId<Task>((taskId: string) => this._tasksManagementService.get$(taskId));

	resultData?: ExportResultData;
	hasMergedTracks = false;

	state: VirtualPlaylistWithStreamStates | null = null;

	exportPlaylistId?: string;

	archive?: { fileId: string; fileName: string };

	@Input() displayGoToMixBtn = false;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _filesRepository: FilesRepository,
		private _virtualPlayerService: VirtualPlayerService,
		private _exportsRepository: ExportsRepository,
		private _tasksManagementService: TasksManagementService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.task$$$.$.pipe(
			untilDestroyed(this),
			tap(() => this._check())
		).subscribe();

		this.entityExport$$$.$.pipe(
			untilDestroyed(this),
			switchMap((exportEntity) => {
				// export result data
				const defaultExportResultData: ExportResultData = { playlists: [] };
				const resultData: ExportResultData = exportEntity?.resultData
					? JSON.parse(exportEntity.resultData)
					: defaultExportResultData;
				this.resultData = resultData;
				this.hasMergedTracks = resultData.playlists.length > 0;

				// export info
				const defaultVirtualExportRequestData: VirtualExportRequestData = { virtualPlaylists: [] };
				const exportData: VirtualExportRequestData = exportEntity?.data
					? JSON.parse(exportEntity?.data)
					: defaultVirtualExportRequestData;

				this.task$$$.id = exportEntity?.taskId;

				if (exportEntity && (resultData || exportEntity?.fileId)) {
					if (resultData.archive) {
						// an archive is available in the result
						this.archive = resultData.archive;
					} else {
						// virtual playlist for each playlist exported
						const exportPlaylistId = ExportItemIdPrefix + exportEntity.id;
						this.exportPlaylistId = exportPlaylistId;

						let virtualTracks$: Observable<VirtualTrack | null>[] = [];

						if (exportEntity.fileId) {
							const virtualTrack$ = this._filesRepository.convertFileIdToVirtualTrack$(
								exportEntity.fileId,
								this.exportPlaylistId
							);
							virtualTracks$.push(virtualTrack$);
						} else {
							virtualTracks$ = resultData.playlists.map((playlistFileDetails) => {
								const virtualTrack$ = this._filesRepository.convertFileIdToVirtualTrack$(
									playlistFileDetails.fileId,
									this.exportPlaylistId
								);
								return virtualTrack$;
							});
						}
						return combineLatest(virtualTracks$).pipe(
							map((vtsU) => {
								const vts = vtsU?.filter((track): track is VirtualTrack => !!track);
								const virtualPlaylist: VirtualPlaylist = {
									id: exportPlaylistId,
									virtualTracks: vts.map((vt, vtIndex) => {
										const newVt: VirtualTrack = {
											...vt,
											id: exportPlaylistId + vtIndex,
										};
										return newVt;
									}),
									noAutoNext: true,
									details: {
										title:
											exportData.exportName ??
											exportData.exportSource?.displayNameAtExportTime ??
											exportEntity.name,
									},
								};
								return virtualPlaylist;
							})
						);
					}
				}

				return of(null);
			}),
			switchMap((virtualPlaylist) => {
				if (!virtualPlaylist) return of(null);
				return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylist);
			}),
			untilDestroyed(this),
			tap((virtualPlaylistState) => {
				this.state = virtualPlaylistState;
				this._check();
			}),

			finalize(() => {
				console.log('ExportItemComponent', 'finalize');
			})
		).subscribe();
	}

	public updateExportInfo() {
		this._filesRepository.fetchFromServer();
		this._exportsRepository.fetchFromServer();
		if (this.task$$$.id) this._tasksManagementService.pullTaskByIdOnce(this.task$$$.id);
	}

	ngOnInit() {
		console.log('init');

		// this._exportsRepository.fetchFromServer();
	}

	ngOnDestroy() {
		console.log('ExportItemComponent', 'ngOnDestroy');
		if (this.exportPlaylistId) this._virtualPlayerService.clearVirtualPlaylist(this.exportPlaylistId);
		// clearInterval(this.ticInterval);
	}
}
