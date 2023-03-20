import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullPageLoadingComponent } from './elements/full-page-loading/full-page-loading.component';

@NgModule({
	imports: [CommonModule],
	declarations: [FullPageLoadingComponent],
	exports: [FullPageLoadingComponent],
})
export class LoadingModule {}
