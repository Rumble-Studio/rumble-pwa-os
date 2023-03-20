import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, Renderer2, ViewChild } from '@angular/core';

import QRCode from 'qrcode';

import { QrcodeElementTypes } from './qrcode.types';
import { DEFAULT_VALUES } from './qrcode.constants';

@Component({
	selector: 'rumble-pwa-qrcode',
	template: `<div
			#qrcElement
			[class]="cssClass"></div>
		<ng-container *ngIf="showDownloadBtn">
			<button
				mat-raised-button
				(click)="saveAsImage()">
				Download QR Code Image
			</button>
		</ng-container>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrcodeComponent implements OnChanges {
	@Input() elementType: 'url' | 'img' | 'canvas' = DEFAULT_VALUES.elementType;
	@Input() cssClass = DEFAULT_VALUES.cssClass;
	@Input() alt?: string;
	@Input() value = DEFAULT_VALUES.value;
	@Input() version = DEFAULT_VALUES.version;
	@Input() errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = DEFAULT_VALUES.errorCorrectionLevel;
	@Input() margin = DEFAULT_VALUES.margin;
	@Input() scale = DEFAULT_VALUES.scale;
	@Input() width = DEFAULT_VALUES.width;
	@Input() colorDark = DEFAULT_VALUES.colorDark;
	@Input() colorLight = DEFAULT_VALUES.colorLight;

	@Input() showDownloadBtn = false;
	@Input() formTitle?: string;

	@ViewChild('qrcElement') qrcElement!: ElementRef;

	constructor(private renderer: Renderer2) {}

	ngOnChanges() {
		this.createQRCode();
	}

	createQRCode() {
		if (!this.value) {
			return;
		}

		let element: HTMLCanvasElement;

		switch (this.elementType) {
			case QrcodeElementTypes.CANVAS:
				element = this.renderer.createElement('canvas');
				this.toCanvas(element)
					.then(() => {
						this.renderElement(element);
					})
					.catch((e) => {
						this.removeElementChildren();
						console.error(e);
					});
				break;
			default:
				element = this.renderer.createElement('img');
				this.toDataURL()
					.then((src: string) => {
						element.setAttribute('src', src);
						element.setAttribute('style', 'width: 100%');
						if (this.alt) {
							element.setAttribute('alt', this.alt);
						}
						this.renderElement(element);
					})
					.catch((e) => {
						this.removeElementChildren();
						console.error(e);
					});
		}
	}

	private toDataURL(): Promise<string> {
		const options: QRCode.QRCodeToDataURLOptions = {
			version: Number(this.version),
			errorCorrectionLevel: this.errorCorrectionLevel,
			margin: this.margin,
			scale: this.scale,
			width: this.width,
			color: {
				dark: this.colorDark,
				light: this.colorLight,
			},
		};

		return QRCode.toDataURL(this.value);
	}

	private toCanvas(canvas: HTMLCanvasElement): Promise<any> {
		return QRCode.toCanvas(canvas, this.value, {
			version: Number(this.version),
			errorCorrectionLevel: this.errorCorrectionLevel,
			margin: this.margin,
			scale: this.scale,
			width: this.width,
			color: {
				dark: this.colorDark,
				light: this.colorLight,
			},
		});
	}

	private renderElement(element: HTMLElement): void {
		this.removeElementChildren();
		this.renderer.appendChild(this.qrcElement.nativeElement, element);
	}

	private removeElementChildren(): void {
		for (const node of this.qrcElement.nativeElement.childNodes) {
			this.renderer.removeChild(this.qrcElement.nativeElement, node);
		}
	}

	saveAsImage() {
		let parentElement = null;

		if (this.elementType === 'canvas') {
			// fetches base 64 data from canvas
			parentElement = this.qrcElement.nativeElement.querySelector('canvas').toDataURL('image/png');
		} else if (this.elementType === 'img' || this.elementType === 'url') {
			// fetches base 64 data from image
			// parentElement contains the base64 encoded image src
			// you might use to store somewhere
			parentElement = this.qrcElement.nativeElement.querySelector('img').src;
		} else {
			alert("Set elementType to 'canvas', 'img' or 'url'.");
		}

		if (parentElement) {
			// converts base 64 encoded image to blobData
			const blobData = this.convertBase64ToBlob(parentElement);
			// saves as image
			const blob = new Blob([blobData], { type: 'image/png' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			// name of the file
			link.download = 'Qrcode' + (this.formTitle ? ' - ' + this.formTitle : '');
			link.click();
		}
	}

	private convertBase64ToBlob(Base64Image: string) {
		// split into two parts
		const parts = Base64Image.split(';base64,');
		// hold the content type
		const imageType = parts[0].split(':')[1];
		// decode base64 string
		const decodedData = window.atob(parts[1]);
		// create unit8array of size same as row data length
		const uInt8Array = new Uint8Array(decodedData.length);
		// insert all character code into uint8array
		for (let i = 0; i < decodedData.length; ++i) {
			uInt8Array[i] = decodedData.charCodeAt(i);
		}
		// return blob image after conversion
		return new Blob([uInt8Array], { type: imageType });
	}
}
