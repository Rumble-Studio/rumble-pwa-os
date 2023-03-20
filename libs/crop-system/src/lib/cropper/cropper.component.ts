import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Dimensions, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';

@Component({
	selector: 'rumble-pwa-cropper',
	templateUrl: './cropper.component.html',
	styleUrls: ['./cropper.component.scss'],
})
export class CropperComponent {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	@Input() imageChangedEvent: any = '';
	@Output() image: EventEmitter<string | undefined | null> = new EventEmitter<string | undefined | null>();
	croppedImage: string | undefined | null = '';
	canvasRotation = 0;
	rotation = 0;
	scale = 1;
	aspectRatio = 4 / 3;
	showCropper = false;
	containWithinAspectRatio = false;
	transform: ImageTransform = {
		flipH: false,
		flipV: false,
		scale: 1,
		rotate: 0,
	};
	imageURL: string | undefined;
	loading = false;

	imageCropped(event: ImageCroppedEvent) {
		this.croppedImage = event.base64;
		this.image.emit(this.croppedImage);
		console.log(event);
	}

	imageLoaded() {
		this.showCropper = true;
		console.log('Image loaded');
	}

	cropperReady(sourceImageDimensions?: Dimensions) {
		console.log('Cropper ready', sourceImageDimensions);
		this.loading = false;
	}

	loadImageFailed() {
		console.error('Load image failed');
	}

	rotateLeft() {
		this.loading = true;
		setTimeout(() => {
			// Use timeout because rotating image is a heavy operation and will block the ui thread
			this.canvasRotation--;
			this.flipAfterRotate();
		});
	}

	rotateRight() {
		this.loading = true;
		setTimeout(() => {
			this.canvasRotation++;
			this.flipAfterRotate();
		});
	}

	private flipAfterRotate() {
		const flippedH = this.transform.flipH;
		const flippedV = this.transform.flipV;
		this.transform = {
			...this.transform,
			flipH: flippedV,
			flipV: flippedH,
		};
	}

	flipHorizontal() {
		this.transform = {
			...this.transform,
			flipH: !this.transform.flipH,
		};
	}

	flipVertical() {
		this.transform = {
			...this.transform,
			flipV: !this.transform.flipV,
		};
	}

	resetImage() {
		this.scale = 1;
		this.rotation = 0;
		this.canvasRotation = 0;
		this.transform = {};
	}

	zoomOut() {
		this.scale -= 0.1;
		this.transform = {
			...this.transform,
			scale: this.scale,
		};
	}

	zoomIn() {
		this.scale += 0.1;
		this.transform = {
			...this.transform,
			scale: this.scale,
		};
		console.log('done');
	}

	toggleContainWithinAspectRatio() {
		this.containWithinAspectRatio = !this.containWithinAspectRatio;
	}

	updateRotation() {
		this.transform = {
			...this.transform,
			rotate: this.rotation,
		};
	}

	toggleAspectRatio() {
		this.aspectRatio = this.aspectRatio === 4 / 3 ? 16 / 9 : 4 / 3;
	}
}
