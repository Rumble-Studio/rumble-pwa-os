import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import {
	CanBeDebugged,
	CanCheck,
	HasLayoutSize,
	ImageZoomService,
	LayoutService,
	LayoutSizeAndCheck,
	VisionService,
} from '@rumble-pwa/utils';
import { ContentLoaderComponent } from '../content-loader/content-loader.component';
import { ExplanationComponent } from '../explanation/explanation.component';

@UntilDestroy()
@Component({
	selector: 'image',
	templateUrl: './image.component.html',
	styleUrls: ['./image.component.scss'],
	standalone: true,
	imports: [
		MatButtonModule,
		RouterModule,
		CommonModule,
		MatIconModule,
		ExplanationComponent,
		ContentLoaderComponent,
		TrackClickDirective,
	],
})
export class ImageComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	@Input() imageUrl: string | undefined;

	@Input() displaySelectButton = false;
	@Input() displayDeleteButton = false;
	@Input() displayPaletteButton = false;
	@Input() displayZoomButton = true;

	@Input() selectButtonText = 'Select';
	@Input() borderRadius = '10px';
	@Input() alt = '';
	@Input()
	objectFit: 'cover' | 'scale-down' | 'contain' = 'cover';

	@Input()
	width = '150px';
	@Input()
	height = '150px';

	@Output()
	imageSelectionEvent = new EventEmitter<void>();
	@Output()
	deleteImageEvent = new EventEmitter<void>();
	@Output()
	imagePaletteEvent = new EventEmitter<string[]>();

	/** If passive: no interaction available and no border/hover effect  */
	@Input() passive = false;

	constructor(
		_cdr: ChangeDetectorRef, // for layout
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,

		private _imageZoomService: ImageZoomService, // to zoom (preview) image
		private _visionService: VisionService
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	public zoomImage() {
		if (!this.imageUrl) return;
		this._imageZoomService.zoomImage(this.imageUrl);
	}

	public emitImageSelectionEvent() {
		this.imageSelectionEvent.emit();
	}

	public emitDeleteImageEvent() {
		this.deleteImageEvent.emit();
	}

	public emitImagePalette() {
		if (!this.imageUrl) return;
		this._visionService.getImagePaletteFromUrl(this.imageUrl, (colors: string[]) => {
			this.imagePaletteEvent.emit(colors);
		});
	}
}
