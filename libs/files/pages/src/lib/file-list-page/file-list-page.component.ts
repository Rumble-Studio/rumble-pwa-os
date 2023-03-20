import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
	ALL_MACRO_FILE_KINDS,
	convertMacroKindsToAcceptedExtensionsString,
	EntityFile,
	MacroFileKindDefined,
} from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-file-list-page',
	templateUrl: './file-list-page.component.html',
	styleUrls: ['./file-list-page.component.scss'],
})
export class FileListPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	/**
	 * List of availables files
	 */
	files: EntityFile[] = [];
	dragndropOver = false;

	searchValue = '';

	_acceptedFileKinds: MacroFileKindDefined[] = ALL_MACRO_FILE_KINDS;
	acceptedFileExtensionsString = convertMacroKindsToAcceptedExtensionsString(this._acceptedFileKinds);

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _layoutRepository: LayoutRepository,
		private _filesRepository: FilesRepository,
		private _fileUploadService: FileUploadService,
		private _usersRepository: UsersRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// get all accessible files
		this._filesRepository.accessibleEntityFiles$
			.pipe(
				untilDestroyed(this),
				tap((accessibleEntityFiles) => {
					this.files = sortBy(accessibleEntityFiles, ['timeCreation', 'timeUpdate']).reverse();
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
					title: 'File library',
					link: undefined,
				},
			],
		});
	}

	processEntityFileEvent(event?: EntityFile) {
		console.log('processEntityFileEvent', event);
		this.searchValue = event?.publicName ?? event?.fileName ?? '';
	}

	/**
	 * Called when dropping files or filling the hidden input
	 * @param fileList
	 * @returns
	 */
	private _handleFileList(fileList: FileList) {
		const files = Array.from(fileList);
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;
		this._fileUploadService
			.uploadNewFiles$(ownerId, -1, this._acceptedFileKinds, 'Upload new files', 'Upload', files, false)
			.pipe(
				take(1),
				tap((entityFiles) => {
					if (entityFiles && entityFiles.length > 0) {
						const entityFileName = entityFiles[0].fileName;
						const publicName = entityFiles[0].publicName;
						this.searchValue = publicName || entityFileName;
						this._check();
					}
					console.log('Result of uploading in file list page:', { entityFiles });
				})
			)
			.subscribe();
	}

	/**
	 * The change event from the hidden file input is catched by the hostListener decorator
	 * @param fileList
	 */
	@HostListener('change', ['$event.target.files'])
	handleFileInputEvent(fileList: FileList | null) {
		if (fileList) this._handleFileList(fileList);
	}

	/**
	 * Detect when files are drop on the page and trigger the upload modal
	 * @param event
	 */
	@HostListener('drop', ['$event'])
	onDrop(event: any) {
		event.preventDefault();
		const fileList: FileList = event.dataTransfer.files;
		this._handleFileList(fileList);
	}

	/**
	 * Needed to detect drop event on the page
	 * @param event
	 */
	@HostListener('dragover', ['$event'])
	onDragOver(event: any) {
		event.preventDefault();
	}
}
