import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityExport } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Mix, MixDetails } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { TasksManagementService } from '@rumble-pwa/tasks-system';
import { CanCheck, Check, DataObsViaId } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-mix-exports-prompt',
	templateUrl: './mix-exports-prompt.component.html',
	styleUrls: ['./mix-exports-prompt.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixExportsPromptComponent extends Check implements CanCheck {
	mix$$$ = new DataObsViaId<Mix>((mixId: string) => this._mixesManagementService.get$(mixId).pipe(untilDestroyed(this)));
	exports: EntityExport[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		private dialogRef: MatDialogRef<MixExportsPromptComponent>,
		private _filesRepository: FilesRepository,
		private notificationsService: NotificationsService,
		private _mixesManagementService: MixesManagementService,
		private _exportsRepository: ExportsRepository,
		private _tasksManagementService: TasksManagementService,
		@Inject(MAT_DIALOG_DATA)
		public mixDetails: MixDetails,
		private _router: Router
	) {
		super(_cdr);

		dialogRef.keydownEvents().subscribe((event) => {
			if (event.key === 'Escape') {
				this.dismiss();
			}
			this._check();
		});

		this.mix$$$.id = mixDetails.mixId;

		this.mix$$$.$.pipe(
			untilDestroyed(this),
			tap(() => {
				this._check();
			})
		).subscribe();

		this.mix$$$.$.pipe(
			untilDestroyed(this),
			switchMap((mix) => {
				if (!mix) return of([]);
				return this._exportsRepository.getExportEntitiesByMixId$(mix.id);
			}),
			tap((exports) => {
				this.exports = exports;
				this._check();
			})
		).subscribe();

		this.updateExportInfo();
	}

	public updateExportInfo() {
		this._filesRepository.fetchFromServer();
		this._exportsRepository.fetchFromServer();
	}

	dismiss() {
		this.dialogRef.close();
	}

	goToAllExports() {
		this.dialogRef.close();
		this._router.navigate(['/exports']);
	}
}
