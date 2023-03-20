import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Inject,
	Input,
	Optional,
	Output,
	QueryList,
	Renderer2,
	TemplateRef,
	Type,
	ViewChildren,
	ViewContainerRef,
} from '@angular/core';
import {
	AbstractControl,
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormControlOptions,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	ValidatorFn,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
	ColorsPickerComponent,
	ExplanationComponent,
	TextListControlComponent,
	TrackScrollDirective,
} from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { uniq } from 'lodash';
import { merge, Observable } from 'rxjs';
import { debounceTime, filter, tap } from 'rxjs/operators';
import { FilesUploadControlComponent } from '../files-upload-control/files-upload-control.component';
import { FormControlOutletComponent } from '../form-control-outlet/form-control-outlet.component';
import { ObjectsPickerComponent } from '../objects-picker/objects-picker.component';

export interface ModalStyle {
	height?: string;
	maxHeight?: string;
	minWidth?: string;
	width: string;
	maxWidth: string;
}

export interface ObjectAttributeOption {
	name: string;
	value: any;
	disabled?: boolean;
	/** Can be used with `attributeTupe = radioSelect` to change the visual of the option */
	customComponent?: Type<any>;
	customPropertiesMapping?: { [key: string]: any };
	onClick?: (event: Event) => Promise<boolean>;
}

export interface ObjectAttribute<T> {
	name: string & keyof T;
	defaultValue?: any;
	placeholder?: string;
	attributeType?:
		| 'button'
		| 'checkbox'
		| 'chiplist'
		| 'color'
		| 'customComponent'
		| 'displayText'
		| 'file'
		// | 'fileList' => use customComponent with a FileTable
		// | 'image' => use customComponent with a FileTable
		| 'input'
		| 'objectThumbnails' // picker of objects getting an image or ng-template
		| 'radioSelect' // has option safety (checks available options at init time)
		| 'select' // has option safety (checks available options at init time)
		| 'slide-toggle'
		| 'textarea'
		| 'text-list-control';

	/** The `HTMLInputSubtype` can be used in combination with `attributeType='input'` */
	HTMLInputSubtype?:
		| 'button'
		| 'date'
		| 'datetime-local'
		| 'email'
		| 'file' // not supported by mat input
		| 'month'
		| 'number'
		| 'password'
		| 'search'
		| 'tel'
		| 'text'
		| 'time'
		| 'url'
		| 'week';
	HTMLpattern?: string;
	required?: boolean;
	HTMLlabel?: string;
	HTMLhint?: string;
	spinner?: { active: boolean; size: number };
	hidden?: boolean;
	/** to make a button inactive */
	disable?: boolean;
	/** to enable palette icon */
	colorThief?: boolean;
	/** Will be used for control accepting multiple values like select, ...	 */
	multiple?: boolean;
	/** Will be used to force user to selected min < selectedOptions < max
	 *
	 * min is required only if attribute is NOT required AND min required > 1
	 */
	multipleRange?: { min?: number; max?: number };
	explanation?: string;

	validators?: FormControlOptions | ValidatorFn | ValidatorFn[] | null | undefined;

	// groupOptions?: {
	// 	groupId: string;
	// 	disabled?: boolean;
	// 	onClick?: (event: Event) => Promise<boolean>;
	// }[];

	editCallBack?: (value: any, promptComponent: ObjectPromptComponent<T>, attribute: ObjectAttribute<T>) => any;
	editCallBackPipeProperties?: { debounceTime?: number };
	callBack?: (value: any, promptComponent: ObjectPromptComponent<T>, attribute: ObjectAttribute<T>) => void;
	callBackPipeProperties?: { debounceTime?: number };

	extra?: {
		/** When an attribute emits a color event we can
		 * use this property to change another attribute value instead
		 */
		colorEventTarget?: string;
		/** options used in select list */
		options?: ObjectAttributeOption[];
		/** object for object list like file table
		 * We use `any` instead of `T` to match the associated control with the object type
		 */
		objects?: any[];

		/** Used by file table / object list if multiple selection allowed */
		maxObjectsSelected?: number;

		/** To filter files not matching extensions */
		acceptedExtensions?: string[];
		acceptedExtensionsString?: string;

		/** For objectThumbnails */
		objectList?: {
			getNewObjects$: (maxElement: number) => Observable<ObjectThumbnail<unknown>[] | null | undefined>;
			objectFit?: 'cover' | 'scale-down' | 'contain';
			hideAddButton?: boolean;
			displaySelectButton?: boolean;
			displayDeleteButton?: boolean;
			/** For object list, to get new objects */
			selectButtonText?: string;
			selectCallback?: any;
			displayPaletteButton?: boolean;
			colorsCallback?: any;
		};

		customTemplate?: TemplateRef<HTMLElement>;

		customComponent?: Type<ControlValueAccessor>;
		customPropertiesMapping?: { [key: string]: any };

		radioSelectWrap?: boolean;
		/** options for chip list */
		chipOptions?: string[];
		chipStyle?: 'default' | 'tag';
	};

	/** To reproduce */
}

export interface ObjectDetails<T> {
	modalTitle: string;
	modalDescription?: string;
	modalSubmitText?: string;
	modalCancelText?: string;
	modalHideActions?: boolean;

	objectId?: string;
	attributes: ObjectAttribute<T>[];

	/** Can be used to prefill the prompt */
	object?: T;
	initialCallback?: (promptComponent: ObjectPromptComponent<T>) => void;

	onSubmit?: (promptComponent: ObjectPromptComponent<T>) => any;
	onSubmitPipeProperties?: { debounceTime?: number };
}

// export interface ObjectResult {
// 	objectId: string;
// }

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-object-prompt',
	standalone: true,
	imports: [
		//
		CommonModule,
		MatIconModule,
		MatButtonModule,
		MatCheckboxModule,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatAutocompleteModule,
		MatProgressSpinnerModule,
		MatDialogModule,
		MatRadioModule,
		MatCheckboxModule,
		MatSlideToggleModule,
		//standalone comp
		ColorsPickerComponent,
		TextListControlComponent,
		ExplanationComponent,
		FilesUploadControlComponent,
		ObjectListComponent,
		ObjectColumnComponent,
		// FileTableComponent,
		ObjectsPickerComponent,
		TrackScrollDirective,
		FormControlOutletComponent,
		TrackClickDirective,
	],
	templateUrl: './object-prompt.component.html',
	styleUrls: ['./object-prompt.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectPromptComponent<T>
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, AfterViewInit
{
	public attributeForm!: FormGroup;
	public attributes: ObjectAttribute<T>[] = [];
	public colorListMap = new Map<string, string[]>();

	@ViewChildren('radioSelectRadioButton', { read: ViewContainerRef })
	radioSelectRadioButton?: QueryList<ViewContainerRef>;
	@ViewChildren('customComponentContainer', { read: ViewContainerRef })
	customComponentContainer?: QueryList<ViewContainerRef>;

	@Output()
	promptResultEvent = new EventEmitter();

	@Output()
	promptCancelEvent = new EventEmitter();

	/** Use of the ! because either objectDetails
	 * comes from MAT_DIALOG_DATA or from @Input() */
	private _objectDetails!: ObjectDetails<T>;
	public get objectDetails() {
		return this._objectDetails;
	}
	@Input()
	public set objectDetails(value) {
		this._objectDetails = value;

		this.attributes = this.objectDetails.attributes;

		this.attributeForm = this._formBuilder.group({});

		// patch the formControl with the object value (or default value)
		this.objectDetails.attributes.forEach((attribute) => {
			let initialValue = attribute.defaultValue;

			// handle case with options (select or radioSelect)
			if (attribute.attributeType === 'select' || attribute.attributeType === 'radioSelect') {
				const availableValues = attribute.extra?.options?.map((option) => option.value) ?? [];

				if (attribute.multiple) {
					// casting to array (because multiple)
					const defaultValues = attribute.defaultValue as ObjectAttributeOption['value'][] | undefined;

					if (defaultValues && !defaultValues.every((defaultValue) => availableValues.includes(defaultValue))) {
						throw new Error('[RS error] Some default values are not in attribute options.');
					}

					const objectValues = this.objectDetails?.object?.[attribute.name] as
						| ObjectAttributeOption['value'][]
						| undefined;

					if (objectValues)
						initialValue = objectValues.filter((objectValue) => availableValues.includes(objectValue));
				} else {
					const defaultValue = attribute.defaultValue as ObjectAttributeOption['value'] | undefined;
					if (defaultValue && !availableValues.includes(defaultValue)) {
						console.error({ attribute });
						throw new Error('[RS error] The default value is not in attribute options.');
					}
					const objectValue = this.objectDetails?.object?.[attribute.name] as ObjectAttributeOption['value'];

					if (objectValue && availableValues.includes(objectValue)) {
						initialValue = objectValue;
					}
				}
			} else {
				initialValue = this.objectDetails?.object?.[attribute.name] ?? initialValue;
			}
			this.attributeForm.addControl(
				attribute.name,
				new FormControl(
					initialValue,
					attribute.multipleRange && attribute.multiple
						? [(control: AbstractControl<any[]>) => this.rangeValidator(control, attribute.multipleRange ?? {})]
						: attribute.validators
				)
			);

			// extra mechanism for complex attributes
			if (attribute.attributeType === 'color') {
				if (attribute.multiple) {
					this.colorListMap.set(attribute.name, (initialValue as string[]) ?? []);
				} else {
					this.colorListMap.set(attribute.name, initialValue ? [initialValue] : []);
				}
			}
			// else if (attribute.attributeType === 'image') {
			// 	if (attribute.multiple) {
			// 		this.imageListMap.set(attribute.name, (initialValue as string[]) ?? []);
			// 	} else {
			// 		this.imageListMap.set(attribute.name, initialValue ? [initialValue] : []);
			// 	}
			// }
		});

		// callback (to react to any changes, including other inputs)
		this.objectDetails.attributes.forEach((attribute) => {
			if (attribute.callBack) {
				this.attributeForm
					.get(attribute.name)
					?.valueChanges.pipe(
						debounceTime(attribute.callBackPipeProperties?.debounceTime ?? 0),
						untilDestroyed(this),
						tap((v) => {
							if (attribute.callBack) attribute.callBack(v, this, attribute);
						})
					)
					.subscribe();
			}
		});

		// register "edit callback" (to update to value changes of the corresponding attribute only)
		this.objectDetails.attributes.forEach((attribute) => {
			this.attributeForm
				.get(attribute.name)
				?.valueChanges.pipe(
					debounceTime(attribute.editCallBackPipeProperties?.debounceTime ?? 0),
					untilDestroyed(this),
					tap((newAttributeValue) => {
						if (attribute.editCallBack) {
							const newValue = attribute.editCallBack(newAttributeValue, this, attribute);
							this.attributeForm.patchValue(
								{
									[attribute.name]: newValue,
								},
								{
									emitEvent: false,
								}
							);
						}

						// extra mechanism for complex attributes
						if (attribute.attributeType === 'color') {
							if (attribute.multiple) {
								const colors: string[] = newAttributeValue ?? [];
								this.colorListMap.set(attribute.name, colors);
							} else {
								const color: string | undefined = newAttributeValue;
								this.colorListMap.set(attribute.name, color ? [color] : []);
							}
						}
						// else if (attribute.attributeType === 'image') {
						// 	if (attribute.multiple) {
						// 		const imageUrls: string[] = newAttributeValue ?? [];
						// 		this.imageListMap.set(attribute.name, imageUrls);
						// 	} else {
						// 		const imageUrl: string | undefined = newAttributeValue;
						// 		this.imageListMap.set(attribute.name, imageUrl ? [imageUrl] : []);
						// 	}
						// }
					})
				)
				.subscribe();
		});
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,

		@Optional()
		private _dialogRef: MatDialogRef<ObjectPromptComponent<T>, Partial<ObjectDetails<T>>>,
		public dialog: MatDialog,
		private _notificationsService: NotificationsService,
		private _formBuilder: FormBuilder,
		private renderer: Renderer2,
		@Optional()
		@Inject(MAT_DIALOG_DATA)
		_objectDetails: ObjectDetails<T>
	) {
		super(_cdr, _layoutService, _activatedRoute);

		if (_objectDetails) this.objectDetails = _objectDetails;
		// handle closing
		if (_dialogRef) {
			_dialogRef.disableClose = true;
			merge(this._dialogRef.keydownEvents().pipe(filter((e) => e.key === 'Escape')), this._dialogRef.backdropClick())
				.pipe(
					untilDestroyed(this),
					tap(() => {
						this._notificationsService
							.confirm('Are you sure to close this dialog?', undefined, 'Keep open', 'Close dialog')
							.subscribe((confirmation) => {
								if (confirmation) {
									this.dismiss();
								}
								this._check();
							});
					})
				)
				.subscribe();
		}
	}

	ngAfterViewInit() {
		if (this.objectDetails.initialCallback) {
			this.objectDetails.initialCallback(this);
		}

		this._processRadioSelectChanges(this.radioSelectRadioButton?.toArray() ?? []);
		this.radioSelectRadioButton?.changes
			.pipe(
				untilDestroyed(this),
				tap((changes) => {
					this._processRadioSelectChanges(changes);
				})
			)
			.subscribe();
	}

	/**
	 * Replace radio buttons (radio group children) by a custom component with mapped properties from attribute
	 * It's an alternative solution to "extra.CustomComponent" to use a pre-existing formControlName like the radio group
	 * and avoid creating a "selector component" for each "item component"
	 * @param matRadioButtons
	 */
	private _processRadioSelectChanges(matRadioButtons: ViewContainerRef[]) {
		matRadioButtons.forEach((matRadioGroup, index) => {
			const attributeName = matRadioGroup.element.nativeElement.dataset['attributeName'] ?? undefined;
			if (!attributeName) return;

			// finding the corresponding object attribute
			const attribute = this.attributes.find((attribute) => attribute.name === attributeName);
			if (!attribute) return;

			if (!(attribute.extra?.options && attribute.extra?.options.length > 0)) {
				return;
			}

			// finding the corresponding option
			const option = attribute.extra.options[index];

			// creating the component to replace the radio option
			if (!option.customComponent) return;

			const newComponent = matRadioGroup.createComponent(option.customComponent);

			// updating this new component properties using extra values
			for (const customPropertyName in option.customPropertiesMapping) {
				newComponent.instance[customPropertyName] = option.customPropertiesMapping[customPropertyName];
			}
			newComponent.changeDetectorRef.detectChanges();

			// filling the radio option with the newly created and updated component
			this.renderer.appendChild(matRadioGroup.element.nativeElement, newComponent.location.nativeElement);
		});
	}

	dismiss(object?: any) {
		if (this._dialogRef) {
			this._dialogRef.close(object);
		} else {
			this.promptCancelEvent.emit();
		}
	}

	save() {
		console.log('Saving object:', this.attributeForm.value, this.attributeForm);

		if (this.objectDetails.onSubmit) this.objectDetails.onSubmit(this);

		if (this.attributeForm.status != 'VALID') {
			this.objectDetails?.attributes.forEach((attribute) => {
				this.attributeForm.get(attribute.name)?.markAsTouched();
				this.attributeForm.get(attribute.name)?.markAsDirty();
			});
			this.attributeForm.markAllAsTouched();
			this._check();
			return;
		}

		if (this._dialogRef) {
			this._dialogRef.close(this.attributeForm.value);
		} else {
			this.promptResultEvent.emit(this.attributeForm.value);
		}
	}

	rangeValidator(control: AbstractControl<any[]>, range: { min?: number; max?: number }) {
		const value = control.value;
		if (!range.min && !range.max) return null;
		if (!value || (range.min !== undefined && value.length < range.min)) {
			return {
				minNumber: 'You must select at least ' + range.min + ' item' + ((range.min ?? 0) > 1 ? 's' : ''),
			};
		}
		if (range.max !== undefined && value.length > range.max) {
			return {
				maxNumber: 'You must select maximum ' + range.max + ' items.',
			};
		}
		return null;
	}

	/**
	 * Called by an option in select
	 * If onClick returns true: we dismiss the dialog
	 * @param onClick
	 * @param event
	 */
	public async callOnClick(onClick: (event: Event) => Promise<boolean>, event: Event) {
		const result = await onClick(event);
		if (result) {
			this.dismiss();
		}
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   Colors management                //
	//                                                    //
	// ---------------------------------------------------//
	public getColors(attributeName: string) {
		return this.colorListMap.get(attributeName) ?? [];
	}

	public processColorsEvent(attributeName: string, colors: string[]) {
		for (const color of colors) {
			this.processColorEvent(attributeName, color);
		}
	}

	public processColorEvent(attributeName: string, newColor: string) {
		const attribute = this.attributes.find((attribute) => attribute.name == attributeName);
		if (!attribute) return;

		let colors: string[] = [];

		if (!attribute.multiple) {
			colors = [newColor];
		} else {
			colors = uniq([...(this.colorListMap.get(attributeName) ?? []), newColor]);
		}

		this.attributeForm.patchValue({
			[attributeName]: attribute.multiple ? colors : newColor,
		});
	}

	public deleteColorByIndex(attributeName: string, colorIndex: number) {
		const attribute = this.attributes.find((attribute) => attribute.name == attributeName);
		if (!attribute) return;

		const colors = this.colorListMap.get(attributeName) ?? [];
		colors.splice(colorIndex, 1);

		this.attributeForm.patchValue({
			[attributeName]: attribute.multiple ? colors : colors.length > 0 ? colors[0] : undefined,
		});
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   Images management                //
	//                                                    //
	// ---------------------------------------------------//

	// public getImageURLs(attributeName: string) {
	// 	return this.imageListMap.get(attributeName) ?? [];
	// }

	// public processNewImage(attributeName: string, newImageUrl: string) {
	// 	console.log('process new image:', newImageUrl);

	// 	const attribute = this.attributes.find((attribute) => attribute.name == attributeName);
	// 	if (!attribute) return;

	// 	let imageURLs: string[] = [];

	// 	if (!attribute.multiple) {
	// 		imageURLs = [newImageUrl];
	// 	} else {
	// 		imageURLs = uniq([...(this.imageListMap.get(attributeName) ?? []), newImageUrl]);
	// 	}

	// 	this.attributeForm.patchValue({
	// 		[attributeName]: attribute.multiple ? imageURLs : newImageUrl,
	// 	});
	// }

	// public deleteImageByIndex(attributeName: string, imageIndex: number) {
	// 	const attribute = this.attributes.find((attribute) => attribute.name == attributeName);
	// 	if (!attribute) return;

	// 	const imageURLs = this.imageListMap.get(attributeName) ?? [];
	// 	imageURLs.splice(imageIndex, 1);

	// 	this.attributeForm.patchValue({
	// 		[attributeName]: attribute.multiple ? imageURLs : imageURLs.length > 0 ? imageURLs[0] : undefined,
	// 	});
	// }

	// ---------------------------------------------------//
	//                                                    //
	//             Custom template management             //
	//                                                    //
	// ---------------------------------------------------//
	processTemplateEvent(event: any) {
		console.log('processTemplateEvent:', { event });
	}

	public processNeedForNewFilesEvent(attributeName: string) {
		console.warn('Not implement processNeedForNewFilesEvent in object prompt', attributeName);
	}
}
