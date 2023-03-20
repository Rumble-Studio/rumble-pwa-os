import { AfterViewInit, ComponentRef, Directive, ElementRef, HostListener, Renderer2, ViewContainerRef } from '@angular/core';
import { ScrollArrowComponent } from '../atoms/scroll-arrow/scroll-arrow.component';

@Directive({
	selector: '[track-scroll]',
	standalone: true,
})
export class TrackScrollDirective implements AfterViewInit {
	arrowComponent?: ComponentRef<ScrollArrowComponent>;

	constructor(
		private elementRef: ElementRef<HTMLElement>,
		private viewContainerRef: ViewContainerRef,
		private renderer: Renderer2
	) {}

	ngAfterViewInit() {
		this.track();
	}

	@HostListener('scroll', ['$event']) // for window scroll events
	track() {
		if (
			this.elementRef.nativeElement.scrollHeight -
				(this.elementRef.nativeElement.clientHeight + this.elementRef.nativeElement.scrollTop) >
			30
		)
			this._addArrow();
		else this._removeArrow();
	}

	private _addArrow(): void {
		if (this.arrowComponent) return;
		this.arrowComponent = this.viewContainerRef.createComponent(ScrollArrowComponent);
		this.renderer.appendChild(this.elementRef.nativeElement, this.arrowComponent.location.nativeElement);
	}

	private _removeArrow() {
		if (!this.arrowComponent) return;
		this.elementRef.nativeElement.removeChild(this.arrowComponent.location.nativeElement);
		this.arrowComponent.destroy();
		this.arrowComponent = undefined;
	}
}
