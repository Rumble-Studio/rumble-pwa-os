import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperModule } from 'ngx-image-cropper';
import { CropperComponent } from './cropper/cropper.component';
import { DesignSystemModule } from '@rumble-pwa/design-system';

@NgModule({
	declarations: [CropperComponent],
	imports: [CommonModule, ImageCropperModule, DesignSystemModule],
	exports: [CropperComponent],
})
export class CropSystemModule {}
