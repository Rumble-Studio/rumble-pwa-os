import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ImageZoomDialogComponent } from './elements/molecules/image-zoom-dialog/image-zoom-dialog.component';
import { QrcodeComponent } from './elements/molecules/qrcode/qrcode.component';
import { MaterialModule } from './material.module';
import { VSpaceComponent } from './utils/v-space/v-space.component';

// const ATOMS = [
// 	//
// ];
const MOLECULES = [
	ImageZoomDialogComponent,
	QrcodeComponent,
	//
];

const UTILS = [
	VSpaceComponent,
	//
];

const SHARED_MODULES = [
	//
	MaterialModule,
	FormsModule,
	ReactiveFormsModule,
	// ContentLoaderModule,
];

@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule,
		...SHARED_MODULES,
	],
	declarations: [
		...UTILS,
		// ...ATOMS,
		...MOLECULES,
		//
	],
	exports: [
		...SHARED_MODULES,
		...UTILS,
		// ...ATOMS,
		...MOLECULES,
		//,
	],
})
export class DesignSystemModule {}
