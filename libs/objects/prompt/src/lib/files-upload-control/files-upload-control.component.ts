/* eslint-disable @typescript-eslint/no-inferrable-types */
import { scopeLoader } from '@rumble-pwa/i18n';
import { translate, TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { convertExtensionToMacroFileKind, MacroFileKind } from '@rumble-pwa/files/models';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck, slugify } from '@rumble-pwa/utils';
import { uniqBy } from 'lodash';

export const FILE_MAX_SIZE_MB = 100;
export const FILE_MAX_PREVIEW_SIZE_MB = 2;
export const FILE_PUBLIC_NAME_MAX_LENGTH = 64;

export interface FileWithData {
	/** Unique id for list ordering and update in place */
	id: string;
	file: File;
	src?: string;
	macroFileKindToUseForPreview?: MacroFileKind;
	publicName?: string;
	// 	tags?: Filetag[];

	extension?: string;

	fileNameWithoutExtension: string;
	tooBigForUpload: boolean;
	tooBigForPreview: boolean;

	toIgnore?: boolean;
	notValid?: boolean;
}

export function convertFileToFileWithData(file: File): FileWithData {
	// getting the macroFileKindToUseForPreview
	const extension: string | undefined = file.name.includes('.') ? file.name.split('.').pop() : undefined;
	const macroFileKindToUseForPreview = convertExtensionToMacroFileKind(extension ?? '');

	// 		// setting the publicName
	const fileNameWithoutExtension = (file.name.includes('.') ? file.name.split('.').slice(0, -1).join('.') : file.name).slice(
		0,
		FILE_PUBLIC_NAME_MAX_LENGTH
	);
	const tooBigForUpload = file.size > FILE_MAX_SIZE_MB * 1024 * 1024;
	const tooBigForPreview = file.size > FILE_MAX_PREVIEW_SIZE_MB * 1024 * 1024;

	const newFileWithData: FileWithData = {
		id: slugify(file.name + file.size),
		file: file,
		publicName: fileNameWithoutExtension.slice(0, 64),
		// src: !tooBigForPreview && !tooBigForUpload ? await newFile.text() : undefined,
		extension,
		macroFileKindToUseForPreview,
		fileNameWithoutExtension,
		tooBigForUpload,
		tooBigForPreview,
		toIgnore: tooBigForUpload,
	};
	return newFileWithData;
}

type OnChangeFn = undefined | ((arg: FileWithData[] | null) => void);
type OnTouchFn = any;

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-files-upload-control',
	standalone: true,
	imports: [
		CommonModule,
		ObjectColumnComponent,
		ObjectListComponent,
		MatIconModule,
		MatInputModule,
		ReactiveFormsModule,
		FormsModule,
		TrackClickDirective,
		TranslocoModule,
	],
	templateUrl: './files-upload-control.component.html',
	styleUrls: ['./files-upload-control.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: FilesUploadControlComponent,
			multi: true,
		},
		{
			provide: TRANSLOCO_SCOPE,
			useValue: {
				// this 2 lines are basically
				// saying "please load the json file into ABC namespace."
				// HTML will need to use at least "profileLayout." to use its content.
				scope: 'objectsPrompt',
				loader: scopeLoader((lang: string) => {
					return import(`../i18n/${lang}.json`);
				}),
			},
		},
	],
})
export class FilesUploadControlComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, ControlValueAccessor, AfterViewChecked
{
	FILE_PUBLIC_NAME_MAX_LENGTH = FILE_PUBLIC_NAME_MAX_LENGTH;

	@Input() maxObjectsSelected: number = -1;

	@Input()
	acceptedExtensions?: string[];
	@Input()
	acceptedExtensionsString = '*/*';

	parseInt = parseInt;
	private _onChange: OnChangeFn;

	filesWithData: FileWithData[] = [];

	@HostListener('change', ['$event.target.files'])
	emitFiles(fileList: FileList) {
		if (!fileList) return;
		const newFilesWithData = Array.from(fileList)
			.map((newFile) => convertFileToFileWithData(newFile))
			.filter((fileWithData) =>
				fileWithData.extension && this.acceptedExtensions && this.acceptedExtensions.length > 0
					? this.acceptedExtensions.includes(fileWithData.extension)
					: false
			);
		this.filesWithData =
			this.maxObjectsSelected > 0
				? newFilesWithData.splice(0, this.maxObjectsSelected)
				: uniqBy([...this.filesWithData, ...newFilesWithData], 'id');

		this._updateAllFileSrcs();
		this._check();
		// need to update formGroup
		if (this._onChange) this._onChange(this.filesWithData.filter((f) => !f.toIgnore && !f.notValid));
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private host: ElementRef<HTMLElement>,
		private sanitizer: DomSanitizer
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	ngAfterViewChecked() {
		this._check();
	}

	/**
	 * Needed for ControlValueAccessor implementation: triggered by a patch value on form group
	 * @param newFilesWithData
	 */
	public writeValue(newFilesWithData: FileWithData[] | null) {
		if (newFilesWithData) {
			this.filesWithData = newFilesWithData;
		}
		setTimeout(() => {
			this._updateAllFileSrcs();
		}, 100);

		// no need to call "onChange" because this value is already in the formGroup
		// and if the updateAllFileSrcs makes some files invalid it will call onChange directly.
		this._check();
	}

	registerOnChange(fn: OnChangeFn) {
		if (fn) {
			this._onChange = fn;
			this._onChange(this.filesWithData.filter((f) => !f.toIgnore && !f.notValid));
		}
		this._check();
	}

	registerOnTouched(fn: OnTouchFn) {
		// console.log('On touch event in files upload control');
	}

	private _updateAllFileSrcs() {
		this.filesWithData.forEach((fileWithData) => {
			this._check();
			if (fileWithData.tooBigForPreview || fileWithData.tooBigForUpload) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const fileAsStr = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string) as string;
				fileWithData.src = fileAsStr;
				this._check();
			};
			reader.onerror = (e) => {
				fileWithData.notValid = true;
				// call onChange to update formGroup because file is invalid (should be loadable)
				if (this._onChange) this._onChange(this.filesWithData.filter((f) => !f.toIgnore && !f.notValid));
				this._check();
			};
			reader.readAsDataURL(fileWithData.file);
		});
	}

	/**
	 * Toggle delete property on fileWithData
	 * @param fileWithDataToRemove
	 * @returns
	 */
	public toggleFileWithDataDeletion(fileWithDataToRemove: FileWithData) {
		const indexToRemove = this.filesWithData.findIndex((fileWithData) => fileWithData.id === fileWithDataToRemove.id);
		if (indexToRemove < 0) return;
		if (this.filesWithData[indexToRemove].tooBigForUpload) return;
		this.filesWithData[indexToRemove].toIgnore = !this.filesWithData[indexToRemove].toIgnore;
		if (this._onChange) this._onChange(this.filesWithData.filter((f) => !f.toIgnore && !f.notValid));
		this._check();
	}

	/**
	 * Used by object-list to dynamicly change row classes
	 * @param fileWithData
	 * @param defaultClasses
	 * @returns
	 */
	public generateRowClasses(
		fileWithData: FileWithData,
		defaultClasses: { [className: string]: boolean }
	): { [className: string]: boolean } {
		return { 'rs-row-greyed': !!fileWithData.toIgnore || !!fileWithData.notValid, ...defaultClasses };
	}
}
