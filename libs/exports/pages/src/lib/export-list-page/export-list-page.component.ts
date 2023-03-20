import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityExport, ExportResultData } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { FilesRepository } from '@rumble-pwa/files/state';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';
import { TasksManagementService } from '@rumble-pwa/tasks-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck, UtilsModule } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-list-page',
	templateUrl: './export-list-page.component.html',
	styleUrls: ['./export-list-page.component.scss'],
	standalone: true,
	imports: [
		//
		CommonModule,
		ObjectListComponent,
		ObjectColumnComponent,
		MatTooltipModule,
		RouterModule,
		MatIconModule,
		MatButtonModule,
		MatMenuModule,
		FormsModule,
		MatSlideToggleModule,
		MatProgressSpinnerModule,
		UtilsModule,
		MatCardModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportListPageComponent extends LayoutSizeAndCheck implements CanCheck, CanBeDebugged, HasLayoutSize {
	entityExports: EntityExport[] = [];

	@Input()
	displayArchivedToggle = true;

	private _displayArchivedExports$$ = new BehaviorSubject(false);
	public get displayArchivedExports() {
		return this._displayArchivedExports$$.value;
	}
	public set displayArchivedExports(value) {
		this._displayArchivedExports$$.next(value);
	}
	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _exportsRepository: ExportsRepository,
		private _router: Router,
		private _notificationsService: NotificationsService,
		private _layoutRepository: LayoutRepository,
		private _tasksManagementService: TasksManagementService,
		private _filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		combineLatest([this._exportsRepository.entityExports$, this._displayArchivedExports$$])
			.pipe(
				untilDestroyed(this),
				tap(([entityExports, displayArchivedExports]) => {
					this.entityExports = sortBy(
						[
							...entityExports.filter(
								(entityExport) =>
									(entityExport.state === 'archived' && displayArchivedExports) ||
									entityExport.state !== 'archived'
							),
						],
						'timeCreation'
					).reverse();
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			displaySidebarLeft: 'auto',
			displayBurgerMenu: 'auto',
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Exports',
					link: undefined,
				},
			],
		});
	}
	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate([tableClickEvent.object.id], {
			relativeTo: this._activatedRoute,
		});
	}

	containsArchive(entityExport: EntityExport): boolean {
		const emptyResultData: ExportResultData = {
			playlists: [],
		};
		const resultData: ExportResultData = entityExport.resultData ? JSON.parse(entityExport.resultData) : emptyResultData;

		return !!resultData.archive;
	}

	containsAudioSegment(entityExport: EntityExport): boolean {
		const emptyResultData: ExportResultData = {
			playlists: [],
		};
		const resultData: ExportResultData = entityExport.resultData ? JSON.parse(entityExport.resultData) : emptyResultData;
		const fileId = entityExport.fileId;
		if (!fileId) return resultData.playlists.length > 0;

		const file = this._filesRepository.get(fileId);
		return file?.kind === 'audio' || file?.kind === 'video';
	}

	archiveExport(entityExport: EntityExport) {
		this._notificationsService
			.confirm()
			.pipe(
				tap((result) => {
					if (result) {
						this._exportsRepository.archive(entityExport.id);
						this._check();
					}
				})
			)
			.subscribe();
	}

	restoreExport(entityExport: EntityExport) {
		this._exportsRepository.restore(entityExport.id);
		this._notificationsService.success('Your export has been restored');
		this._check();
	}
	getTaskStatus(entityExport: EntityExport): string | undefined {
		const taskId = entityExport.taskId;
		if (!taskId) return 'default';
		const task = this._tasksManagementService.get(taskId);
		if (!task) return 'default';
		if (task.complete) {
			if (task.failed) return 'failed';
			else return 'default';
		} else {
			return 'in_progress';
		}
	}

	getTaskStatus$(entityExport: EntityExport): Observable<string | undefined> {
		const taskId = entityExport.taskId;
		if (!taskId) return of('default');
		return this._tasksManagementService.get$(taskId).pipe(
			map((task) => {
				if (!task || task.complete) return 'default';
				if (task.failed) return 'failed';
				return 'in_progress';
			})
		);
	}

	openEditEntityExportPrompt(entityExport: EntityExport) {
		this._exportsRepository
			.openExportFilePrompt(entityExport.fileId, undefined, {
				entityExport: entityExport,
				modalTitle: 'Edit your export',
				modalDescription: '',
			})
			.pipe(
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}
}
