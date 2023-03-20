import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FileTableComponent } from '@rumble-pwa/files/display';
import {
	convertMacroKindsToAcceptedExtensionsString,
	EntityFile,
	Filetag,
	MacroFileKindDefined,
} from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { VirtualTrack } from '@rumble-pwa/player/services';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { TodoOpenComponent } from '@rumble-pwa/todo';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Bss$$ } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { combineLatest } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { FiletagsRepository } from '@rumble-pwa/filetags/state';
import { v4 as uuidv4 } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-files-as-source',
	templateUrl: './files-as-source.component.html',
	styleUrls: ['./files-as-source.component.scss'],
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualPlaylistComponent,
		FileTableComponent,
		TodoOpenComponent,
		MatButtonModule,
		TrackClickDirective,
	],
})
export class FilesAsSourceComponent extends LayoutSizeAndCheck implements HasLayoutSize, CanCheck, CanBeDebugged {
	tags$$ = new Bss$$<string[]>([]);
	public get tags() {
		return this.tags$$.value;
	}
	@Input()
	public set tags(value) {
		this.tags$$.value = value;
	}

	@Input() tagValuesForNewFiles: string[] = [];

	@Input() displayKindTags: string[] = [];

	@Input() hideColumns: string[] = [];

	@Input() connectDropTo: string[] = [];
	@Output() virtualTracksEmitter: EventEmitter<VirtualTrack[]> = new EventEmitter();
	@Output() tableClickEvent: EventEmitter<TableClickEvent<EntityFile>> = new EventEmitter();
	files: EntityFile[] = [];

	searchValue = '';

	_acceptedFileKinds: MacroFileKindDefined[] = ['audio', 'video'];
	acceptedFileExtensionsString = convertMacroKindsToAcceptedExtensionsString(this._acceptedFileKinds);

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _filesRepository: FilesRepository, // private _openFileUploadService: OpenFileUploadService,
		private _fileUploadService: FileUploadService,
		private _usersRepository: UsersRepository,
		private _fileTagsRepository: FiletagsRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// list all accessible files
		combineLatest([this._filesRepository.accessibleEntityFiles$, this.tags$$.$])
			.pipe(
				untilDestroyed(this),
				tap(([accessibleEntityFiles, tags]) => {
					this.files = sortBy(
						accessibleEntityFiles
							.filter((f) => ['audio', 'video'].includes(f.kind ?? ''))
							.filter((f) =>
								tags.length > 0 ? tags.some((tag) => f.filetags?.map((tags) => tags.value).includes(tag)) : !!f
							),
						['timeCreation', 'timeUpdate']
					).reverse();
					this._check();
				})
			)

			.subscribe();
	}

	/**
	 * Called when dropping files or filling the hidden input
	 * @param fileList
	 * @returns
	 */
	private _handleFileList(fileList: FileList | null) {
		if (!fileList) return;
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;
		const preExistingFiles = Array.from(fileList);
		this._fileUploadService
			.uploadNewFiles$(ownerId, -1, this._acceptedFileKinds, 'Upload new files', 'Upload', preExistingFiles, true)
			.pipe(
				take(1),
				tap((entityFiles) => {
					if (entityFiles && entityFiles.length > 0) {
						const entityFileName = entityFiles[0].fileName;
						const publicName = entityFiles[0].publicName;
						this.searchValue = publicName || entityFileName;
					}

					if (entityFiles && entityFiles.length > 0 && this.tagValuesForNewFiles.length > 0) {
						entityFiles.forEach((entityFile) => {
							this.tagValuesForNewFiles.forEach((tagValueForNewFiles) => {
								const fileTagsMatchingValue = this._fileTagsRepository.getCustomTagByValue(tagValueForNewFiles);
								if (fileTagsMatchingValue.length > 0) {
									this._fileTagsRepository.toggleFiletag(entityFile.id, fileTagsMatchingValue[0].id);
								} else {
									const newFileTag: Filetag = {
										id: uuidv4(),
										kind: 'custom',
										value: tagValueForNewFiles,
									};
									this._fileTagsRepository
										.createFiletag$(newFileTag)
										.pipe(
											untilDestroyed(this),
											tap(() => {
												this._fileTagsRepository.toggleFiletag(entityFile.id, newFileTag.id);
											})
										)
										.subscribe();
								}
							});
						});
					}
					this._check();

					console.log('Result of uploading in file as source:', { entityFiles });
				})
			)
			.subscribe();
	}

	/**
	 * The change event from the hidden file input is catched by the hostListener decorator
	 * @param fileList
	 */
	@HostListener('change', ['$event.target.files'])
	handleFileInputEvent(fileList: FileList) {
		this._handleFileList(fileList);
	}

	processTableClickEvent(event: TableClickEvent<EntityFile>) {
		this.tableClickEvent.emit(event);
	}
}
