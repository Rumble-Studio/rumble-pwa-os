import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ExplanationComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityExport } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { EntityFile, EntityFileData } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FiletagsRepository } from '@rumble-pwa/filetags/state';
import { TagPillComponent } from '@rumble-pwa/filetags/ui';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { ObjectColumnComponent, ObjectList, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';
import { FilePlayerComponent } from '@rumble-pwa/player/specialised';
import { RestService } from '@rumble-pwa/requests';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { GenericFavoriteComponent } from '@rumble-pwa/users/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck, UtilsModule } from '@rumble-pwa/utils';
import { cloneDeep, isEqual } from 'lodash';
import { tap } from 'rxjs/operators';

export interface FileWithOwner extends EntityFile, ObjectList {
	owner?: User;
	extraId?: string;
	extraName?: string;
	extraDescription?: string;
}

type OnChangeFn = undefined | ((arg: FileWithOwner[] | null) => void);
type OnTouchFn = unknown;

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-file-table',
	templateUrl: './file-table.component.html',
	styleUrls: ['./file-table.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ObjectListComponent,
		ObjectColumnComponent,
		GroupItemGenericComponent,
		MatButtonModule,
		MatMenuModule,
		MatIconModule,
		GenericFavoriteComponent,
		FilePlayerComponent,
		MatChipsModule,
		TagPillComponent,
		ExplanationComponent,
		UtilsModule, // duration pipe
		MatTooltipModule,
		TrackClickDirective,
		MatProgressSpinnerModule,
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: FileTableComponent,
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTableComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, ControlValueAccessor
{
	private _files: FileWithOwner[] = [];
	public get files() {
		return this._files;
	}
	@Input()
	public set files(value) {
		this._files = cloneDeep(value);
		this._detechChanges();
	}

	/** If set: only display tags for which the kind is in this list */
	@Input() displayKindTags: string[] = [];
	/** If set: do not display columns for which the id is in this list */
	@Input() hideColumns: string[] = [];

	/** Should we display the checkbox column */
	@Input() allowSelection = false;

	/** Used when selection is allowed */
	@Input() maxObjectsSelected = 1;

	private _selection: FileWithOwner[] = [];
	public get selection() {
		return this._selection;
	}
	@Input()
	public set selection(newValue) {
		const valueToUse = this.maxObjectsSelected <= 0 ? newValue : newValue.splice(0, this.maxObjectsSelected);
		if (isEqual(this._selection, valueToUse)) {
			return;
		}
		this._selection = valueToUse;
		console.log('file table new selection:', valueToUse);
		if (this._onChange) this._onChange(valueToUse);
		this._check();
	}

	@Input() displayExtraFileProperties?: boolean;

	// filesWithOwners: FileWithOwner[] = [];

	@Input() connectDropTo: string[] = [];

	/** If true: add `mat-elevation-z8` class to the div containting table element  */
	@Input()
	elevatedClass = true;

	@Input()
	displayDetails = true;

	@Input() public middleActionTpl?: TemplateRef<HTMLElement>;
	@Input() public topLeftActionTpl?: TemplateRef<HTMLElement>;
	@Input() public customMoreMenuTpl?: TemplateRef<HTMLElement>;

	private _searchValue = '';
	public get searchValue() {
		return this._searchValue;
	}
	@Input()
	public set searchValue(value) {
		this._searchValue = value;
		this._check();
	}

	/** Used for shared icon display */
	profile: User | null = null;

	/** Used for tag menu (like public toggle)  */
	isSuperUser = false;

	@Output() tableClickEvent = new EventEmitter<TableClickEvent<FileWithOwner>>();
	private _onChange: OnChangeFn;

	exports: EntityExport[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _restService: RestService,
		private _filetagsRepository: FiletagsRepository,
		private _exportsRepository: ExportsRepository,
		public sanitizer: DomSanitizer,
		public _objectPromptService: ObjectPromptService,
		public _filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this._exportsRepository.entityExports$
			.pipe(
				tap((exports) => {
					this.exports = exports;
				})
			)
			.subscribe();

		// subscribe to profile changes
		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((profile) => {
					// super user state
					this.profile = profile;
					this.isSuperUser = !!profile?.isSuperuser;
					this._check();
				})
			)
			.subscribe();
	}

	/**
	 * Needed for ControlValueAccessor implementation: triggered by a patch value on form group
	 * @param newFilesWithData
	 */
	public writeValue(filesWithOwner: FileWithOwner[] | null) {
		this.selection = filesWithOwner ?? [];
	}

	registerOnChange(fn: OnChangeFn) {
		this._onChange = fn;
		this._check();
	}

	registerOnTouched(fn: OnTouchFn) {
		// console.log('On touch event in files upload control', fn);
	}

	public openRenameFilePrompt(file: FileWithOwner) {
		this._objectPromptService
			.openObjectPromptModal$<FileWithOwner>({
				modalTitle: 'Rename file',
				modalSubmitText: 'save',
				object: file,
				attributes: [
					{
						name: 'publicName',
						HTMLlabel: 'File name',
						required: true,
					},
				],
			})
			.pipe(
				tap((result) => {
					if (result?.publicName && result?.publicName !== file.publicName && this.profile?.id === file.ownerId) {
						this._filesRepository.updateEntityFile(file.id, result);
					}
				})
			)
			.subscribe();
	}

	public getConvertObjectToSortableElement() {
		return (object: FileWithOwner, propertyNameAsString: string) =>
			this.convertObjectToSortableElement(object, propertyNameAsString);
	}

	public convertObjectToSortableElement(object: FileWithOwner, propertyNameAsString: string) {
		if (propertyNameAsString === 'filetags') {
			return object.filetags?.map((tag) => tag.title ?? tag.kind).join(' ') ?? '';
		}

		if (propertyNameAsString === 'owner') {
			const user = this._usersRepository.get(object.ownerId);
			return user?.fullName ?? user?.email ?? '';
		}

		if (!(propertyNameAsString in object)) {
			// return
			throw new Error(`Could not find property ${propertyNameAsString} in object`);
		}

		const propertyName = propertyNameAsString as keyof FileWithOwner;

		if (typeof object[propertyName] === 'string') {
			return (object[propertyName] as unknown as string).toLowerCase();
		}
		if (typeof object[propertyName] === 'number') {
			return object[propertyName] as unknown as number;
		}
		return object[propertyName] ? 1 : 0;
	}

	public convertObjectToSearchableString(object: FileWithOwner): string {
		const searchableString = JSON.stringify(object);
		return searchableString;
	}

	processTableClick(tableClickEvent: TableClickEvent<any>) {
		this.tableClickEvent.emit(tableClickEvent);
		switch (tableClickEvent.columnId) {
			case 'filetags': {
				this.processFileTagsColumnClick(tableClickEvent.object);
				break;
			}
			default:
				break;
		}
	}

	processFileTagsColumnClick(file: EntityFile) {
		const fileId = file.id;
		if (!fileId) return;
		this._filetagsRepository.openPromptEditor({ fileId }).pipe(untilDestroyed(this)).subscribe();
	}

	public toggleTag(fileId: string, tagId: string) {
		return this._filetagsRepository.toggleFiletag(fileId, tagId);
	}

	public exportFile(entityFile: EntityFile) {
		this._exportsRepository
			.openExportFilePrompt(entityFile.id, entityFile.duration)
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}

	getExportByFileId$(fileId: string) {
		return this._exportsRepository.getExportsByFileId$(fileId);
	}

	getFileDownloadUrl(file: FileWithOwner) {
		return this._restService.apiRoot + '/files/' + file.id + '/download';
	}

	public getUrlFromUrlDetails(urlDetails: any) {
		return urlDetails.url as string;
	}

	public getMediaInfoFromData(entityFile: EntityFile) {
		const defaultFileData: EntityFileData = {};
		const fileData: EntityFileData = entityFile.data ? JSON.parse(entityFile.data) : defaultFileData;
		if (fileData.mediaInfo) {
			return fileData.mediaInfo;
		} else {
			const defaultMediaInfo: EntityFileData['mediaInfo'] = {};
			return defaultMediaInfo;
		}
	}
}
