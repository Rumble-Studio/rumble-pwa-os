import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { combineLatest } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { FileUploadService, UploadableFile, UploadingState } from '../file-upload.service';

interface UploadableFileWithUserAction {
	uploadableFile: UploadableFile;
	hidden?: boolean;
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-file-upload-popup',
	standalone: true,
	imports: [
		//
		CommonModule,
		MatProgressBarModule,
		MatIconModule,
		TrackClickDirective,
	],
	templateUrl: './file-upload-popup.component.html',
	styleUrls: ['./file-upload-popup.component.scss'],
})
export class FileUploadPopupComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	uploadableFiles: { [id: string]: UploadableFileWithUserAction } = {};

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private host: ElementRef<HTMLElement>,
		public filesRepository: FilesRepository,
		private _fileUploadService: FileUploadService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this._fileUploadService.newUploadableFileEvent$$
			.pipe(
				untilDestroyed(this),
				switchMap(() => {
					return combineLatest(
						Array.from(this._fileUploadService.uploadableFilesMap.values()).map((bss$$) => bss$$.$$)
					);
				}),
				startWith([]),
				tap((uploadableFiles) => {
					uploadableFiles.forEach((uploadableFile) => {
						this.uploadableFiles[uploadableFile.identifier] = {
							...this.uploadableFiles[uploadableFile.identifier],
							uploadableFile,
						};
						if (
							this.uploadableFiles[uploadableFile.identifier].uploadableFile.state ==
							UploadingState.PROCESSUS_OVER_16
						) {
							setTimeout(() => {
								this.uploadableFiles[uploadableFile.identifier].hidden = true;
								this._refreshDisplay();
							}, 2000);
						}
					});

					this._refreshDisplay();
				})
			)
			.subscribe();
	}

	public hide(identifier: string) {
		this.uploadableFiles[identifier] = { ...this.uploadableFiles[identifier], hidden: true };
		this._refreshDisplay();
	}

	private _refreshDisplay() {
		if (Object.keys(this.uploadableFiles).every((identifier) => !!this.uploadableFiles[identifier].hidden)) {
			this.host.nativeElement.style.display = 'none';
		} else {
			this.host.nativeElement.style.display = 'block';
		}
		this._check();
	}
}
