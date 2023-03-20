import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
	// eslint-disable-next-line @angular-eslint/directive-selector
	selector: '[focusout]',
})
export class FocusoutDirective {
	@Output() focusOut: EventEmitter<boolean> = new EventEmitter<boolean>(false);

	@HostListener('blur', ['$event'])
	public onListenerTriggered(event: any): void {
		console.log('[FocusoutDirective](onListenerTriggered)');
		this.focusOut.emit(true);
	}

	constructor() {
		console.log('[FocusoutDirective](constructor)');
	}
}
