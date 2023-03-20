import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'rumble-pwa-text-list-editor',
	templateUrl: './text-list-editor.component.html',
	styleUrls: ['./text-list-editor.component.scss'],
})
export class TextListEditorComponent {
	private _textLlist: string | undefined;
	@Input()
	public set textList(v: string | undefined) {
		if (v === this._textLlist) return;
		this._textLlist = v;
	}
	public get textList(): string | undefined {
		return this._textLlist;
	}

	@Output() textListChanged: EventEmitter<string> = new EventEmitter();

	inputValue = '';

	addItemToList(event: any) {
		const value = event.target?.value || event;
		if (!value) return;
		const newList = this.textList ? this.textList + ';' + value : value;
		this.textList = newList;
		this.clearInputValue();
		this.emitTextList();
	}

	deleteItemFromList(itemIndex: number) {
		if (!this.textList) return;
		const listSplitted = this.textList.split(';');
		if (!listSplitted) return;
		listSplitted.splice(itemIndex, 1);
		const textListJoined = listSplitted.join(';');
		this.textList = textListJoined;
		this.emitTextList();
		this.clearInputValue();
	}

	emitTextList() {
		this.textListChanged.emit(this.textList);
	}

	clearInputValue() {
		this.inputValue = '';
	}

	drop(event: CdkDragDrop<string[]>) {
		if (!this.textList) return;
		const listSplitted = this.textList.split(';');
		if (!listSplitted) return;
		moveItemInArray(listSplitted, event.previousIndex, event.currentIndex);
		const textListJoined = listSplitted.join(';');
		this.textList = textListJoined;
		this.clearInputValue();
		this.emitTextList();
	}
}
