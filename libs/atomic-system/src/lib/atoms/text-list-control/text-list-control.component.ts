import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

type OnChangeFn = undefined | ((arg: string[] | null) => void);
type OnTouchFn = any;
@UntilDestroy()
@Component({
	selector: 'rumble-pwa-text-list-control',
	templateUrl: './text-list-control.component.html',
	styleUrls: ['./text-list-control.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatFormFieldModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatIconModule,
		MatInputModule,
		MatChipsModule,
		MatAutocompleteModule,
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: TextListControlComponent,
			multi: true,
		},
	],
})
export class TextListControlComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, ControlValueAccessor
{
	_textListItems: string[] = [];

	// ---------------------------------------------------//
	//                                                    //
	//                    INPUT PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	@Input()
	set textListItems(newTextListItems: string[]) {
		this._textListItems = newTextListItems;
		if (this._onChange) {
			this._onChange(newTextListItems);
		}
	}
	get textListItems() {
		return this._textListItems;
	}

	@Input()
	textListItemsAvailable: string[] = [];
	@Input()
	placeholder?: string;

	@Input() canYouEdit?: boolean;

	// ---------------------------------------------------//
	//                                                    //
	//                FORM CTRL PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	separatorKeysCodes: number[] = [ENTER, COMMA, SEMICOLON];

	textListItemCtrl = new FormControl('');
	filteredTextListItems: Observable<string[]>;

	@ViewChild('textListItemInput') textListItemInput?: ElementRef<HTMLInputElement>;
	@ViewChild(MatAutocompleteTrigger) autoTrigger?: MatAutocompleteTrigger;

	// ---------------------------------------------------//
	//                                                    //
	//              VALUE ACCESSOR PROPERTIES             //
	//                                                    //
	// ---------------------------------------------------//

	private _onChange: OnChangeFn;

	constructor(
		_cdr: ChangeDetectorRef, // for layout
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.filteredTextListItems = this.textListItemCtrl.valueChanges.pipe(
			startWith(null),
			map((searchTerm: string | null) => (searchTerm ? this._filter(searchTerm) : this._filter('')))
		);
	}

	/**
	 * Emit the item index to remove and clear the form control
	 * @param textListItemIndexToRemove
	 */
	removeTextItemByIndex(textListItemIndexToRemove: number): void {
		this.textListItems.splice(textListItemIndexToRemove, 1);
	}

	/**
	 * Emit the new item and clear the form control
	 * @param event
	 */
	addTextItem(event: MatChipInputEvent) {
		const value = (event.value || '').trim();
		if (value) this.textListItems.push(value);
		if (event.chipInput) event.chipInput.clear();
		this.textListItemCtrl.setValue(null);
	}

	/**
	 * Used when item from autocomplete has been selected
	 * @param event
	 * @returns
	 */
	selectTextItem(event: MatAutocompleteSelectedEvent): void {
		if (!event.option.viewValue) return;

		if (!this.textListItems.some((textListItem) => textListItem === event.option.viewValue)) {
			this.textListItems.push(event.option.viewValue);
		}

		if (this.textListItemInput) this.textListItemInput.nativeElement.value = '';

		this.textListItemCtrl.setValue(null);
		this.openTextItemSelectionPanel();
		this._check();
	}

	/**
	 * Needed for ControlValueAccessor implementation: triggered by a patch value on form group
	 * @param newFilesWithData
	 */
	public writeValue(newvalue: string[] | null) {
		console.log('Patched value in text-list-control:', newvalue);
		this.textListItems = newvalue ?? [];
	}

	registerOnChange(fn: OnChangeFn) {
		this._onChange = fn;
		this._check();
	}

	registerOnTouched(fn: OnTouchFn) {
		// console.log('On touch event in files upload control');
	}

	private _filter(value: string): string[] {
		const filterValue = value.toLowerCase();
		return sortBy(
			this.textListItemsAvailable
				.filter((textListItemAvailable) => textListItemAvailable.toLowerCase().includes(filterValue))
				.filter(
					(textListItemAvailable) =>
						!this.textListItems.find((textListItem) => textListItem === textListItemAvailable)
				),
			'value'
		);
	}

	private openTextItemSelectionPanel(): void {
		setTimeout(() => {
			this.autoTrigger?.openPanel();
		}, 1);
	}
}
