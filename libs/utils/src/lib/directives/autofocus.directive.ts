import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
	selector: '[rumblePwaAutoFocus]',
})
export class AutofocusDirective implements AfterViewInit {
	constructor(private host: ElementRef) {
		const interval = setInterval(() => {
			if (this.host?.nativeElement) {
				clearInterval(interval);
				// this.host.nativeElement.focus();
			}
		}, 100);
	}

	ngAfterViewInit(): void {
		const interval = setInterval(() => {
			if (this.host?.nativeElement) {
				clearInterval(interval);
				this.host.nativeElement.focus();
			}
		}, 200);
	}
}
