import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface Option {
	label: string;
	checked: boolean;
}

@Component({
	selector: 'rumble-pwa-text-list-consumer',
	templateUrl: './text-list-consumer.component.html',
	styleUrls: ['./text-list-consumer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextListConsumerComponent {
	selectedItems$ = new Subject<string[]>();

	private _textLlist: string | undefined;
	@Input()
	public set textList(v: string | undefined) {
		if (v === this._textLlist) return;
		this._textLlist = v;
		if (this._textLlist) {
			this.options = this._textLlist.split(';').map((item) => ({
				label: item,
				checked: false,
			}));
		}
	}
	public get textList(): string | undefined {
		return this._textLlist;
	}

	@Input()
	multipleChoicesAllowed = true;

	private _selectedItemsAsStr?: string;
	public get selectedItemsAsStr() {
		return this._selectedItemsAsStr;
	}
	@Input()
	public set selectedItemsAsStr(value) {
		this._selectedItemsAsStr = value;
		if (this._selectedItemsAsStr) {
			this.options = this.options.map((o) => ({
				...o,
				checked: this._selectedItemsAsStr?.includes(o.label) ?? false,
			}));
		}
	}

	@Output()
	answer: EventEmitter<string[]> = new EventEmitter<string[]>();

	options: Option[] = [];

	constructor(private cdr: ChangeDetectorRef) {
		this.selectedItems$.pipe(debounceTime(100)).subscribe((selectedItems) => {
			this.answer.emit(selectedItems);
			this.check();
		});
	}

	updateAllComplete() {
		this.selectedItems$.next(this.options.filter((o) => o.checked).map((o) => o.label));
	}

	private check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
