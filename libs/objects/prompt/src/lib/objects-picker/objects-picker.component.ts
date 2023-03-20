import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ExplanationComponent, ImageComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { cloneDeep, isEqual } from 'lodash';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';

type OnChangeFn<T> = undefined | ((arg: ObjectThumbnail<T>[] | null) => void);
type OnTouchFn = unknown;

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-objects-picker',
	templateUrl: './objects-picker.component.html',
	imports: [
		CommonModule,
		RouterModule,
		MatIconModule,
		MatButtonModule,
		MatDividerModule,
		ExplanationComponent,
		ImageComponent,
		TrackClickDirective,
	],
	standalone: true,
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: ObjectsPickerComponent,
			multi: true,
		},
	],
	styleUrls: ['./objects-picker.component.scss'],
})
export class ObjectsPickerComponent<T>
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, ControlValueAccessor
{
	/**
	 * May be used for control accessor
	 */
	private _onChange: OnChangeFn<T>;

	private _objectThumbnails: ObjectThumbnail<T>[] = [];
	public get objectThumbnails() {
		return this._objectThumbnails;
	}
	@Input()
	public set objectThumbnails(newValue) {
		if (isEqual(this._objectThumbnails, newValue)) {
			console.log('same values');
			return;
		}
		console.log('New object items:', newValue);

		this._objectThumbnails = newValue;
		this._check();
		if (this._onChange) {
			console.log('Updating form:', newValue);

			this._onChange(newValue);
		}
		this.objectThumbnailsChange.emit(newValue);
	}
	@Output() objectThumbnailsChange = new EventEmitter<ObjectThumbnail<T>[]>();

	@Input()
	objectFit: 'cover' | 'scale-down' | 'contain' = 'cover';

	/** Should we display the palette button to allow for color extraction */
	@Input() displayPaletteButton = false;

	@Input() maxSelectableObjects = -1;

	@Output()
	selectObjectByIndexEvent = new EventEmitter<number>();

	@Output()
	colorsEvent = new EventEmitter<string[]>();

	@Input() getNewObjects$?: (maxElement: number) => Observable<ObjectThumbnail<T>[] | null | undefined>;

	@Input() canYouEdit = true;

	@Input()
	displaySelectButton = false;

	@Input()
	displayDeleteButton = true;

	@Input()
	selectButtonText = 'Select';

	@Input()
	confirmBeforeDeletion = true;

	@Input()
	hideAddButton = false;

	@Input()
	flexWrap: 'wrap' | 'nowrap' = 'wrap';

	constructor(
		_cdr: ChangeDetectorRef, // for layout
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	/**
	 * Needed for ControlValueAccessor implementation: triggered by a patch value on form group
	 * @param newFilesWithData
	 */
	public writeValue(newObjectThumbnails: ObjectThumbnail<T>[] | null) {
		console.log('write value', newObjectThumbnails);

		this._objectThumbnails = newObjectThumbnails ?? [];
		// this._check();
	}

	registerOnChange(fn: OnChangeFn<T>) {
		this._onChange = fn;
		this._check();
	}

	registerOnTouched(fn: OnTouchFn) {
		// console.log('On touch event in files upload control', { fn });
	}

	/**
	 * Delete object by index
	 * @param objectIndex : index of the object to delete
	 */
	deleteObjectByIndex(objectIndex: number) {
		if (this.confirmBeforeDeletion) {
			this._notificationsService
				.confirm('Are you sure to delete this element?')
				.pipe(untilDestroyed(this))
				.subscribe((confirm) => {
					if (confirm) {
						this._removeObjectByIndex(objectIndex);
					}
				});
		} else {
			this._removeObjectByIndex(objectIndex);
		}
	}
	_removeObjectByIndex(objectIndex: number) {
		const objectThumbnails = cloneDeep(this.objectThumbnails);
		objectThumbnails.splice(objectIndex, 1);
		this.objectThumbnails = objectThumbnails;
	}

	/**
	 * Mark object as selected
	 * @param objectIndex
	 */
	selectObjectByIndex(objectIndex: number) {
		this.selectObjectByIndexEvent.emit(objectIndex);
	}

	public emitColorsEvent(colors: string[]) {
		this.colorsEvent.emit(colors);
	}

	public getNewObjects() {
		if (!this.getNewObjects$) {
			console.error('Source to get new objects not defined');
			return;
		}
		this.getNewObjects$(this.maxSelectableObjects >= 0 ? this.maxSelectableObjects - this.objectThumbnails.length : 100)
			.pipe(
				untilDestroyed(this),
				take(1),
				tap((objects) => {
					if (objects && objects.length > 0) {
						this.objectThumbnails = [...objects, ...this.objectThumbnails];
					}
				})
			)
			.subscribe();
	}
}
