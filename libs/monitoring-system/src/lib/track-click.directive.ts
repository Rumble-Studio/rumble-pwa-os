import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { slugify } from '@rumble-pwa/utils';
import { AmplitudeService } from './amplitude.service';

@Directive({
	// eslint-disable-next-line @angular-eslint/directive-selector
	selector: 'button, [trackClick],.rs-clickable',
	standalone: true,
})
export class TrackClickDirective {
	constructor(
		private elementRef: ElementRef<HTMLElement>,
		private router: Router,
		private _amplitudeService: AmplitudeService
	) {}

	@Input()
	trackClick?: { customTextContent?: string; customEventProperties?: any };

	@HostListener('click', ['$event.target'])
	processClickEvent(target: HTMLElement) {
		const nodeName = this.elementRef.nativeElement.nodeName;
		const nodeTitle = this.elementRef.nativeElement.title;
		const textContent = this.elementRef.nativeElement.textContent;
		const url = this.router.url;
		const eventName = this.trackClick?.customTextContent
			? 'click:' + nodeName.toLowerCase() + '|' + slugify(this.trackClick.customTextContent.trim())
			: 'click:' + nodeName.toLowerCase() + '|' + (textContent ? slugify(textContent.trim()) : '');
		const eventProperties = {
			eventName,
			nodeTitle,
			nodeName,
			textContent,
			url,
			...this.trackClick?.customEventProperties,
		};
		this._amplitudeService.saveEvent('click', eventProperties);
	}
}
