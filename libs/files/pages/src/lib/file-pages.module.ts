import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DownloaderComponent, ExplanationComponent } from '@rumble-pwa/atomic-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FileTableComponent } from '@rumble-pwa/files/display';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { RecordActionsComponent } from '@rumble-pwa/record/ui';
import { DownloadPageComponent } from './download-page/download-page.component';
import { FileListPageComponent } from './file-list-page/file-list-page.component';

const routes = [
	{
		path: '',
		component: FileListPageComponent,
	},
	{
		path: ':fileId',
		component: DownloadPageComponent,
	},
];

@NgModule({
	imports: [
		//
		CommonModule,
		DesignSystemModule,
		RouterModule.forChild(routes),
		DownloaderComponent,
		FileTableComponent,
		RecordActionsComponent,
		ExplanationComponent,
		TrackClickDirective,
	],
	declarations: [DownloadPageComponent, FileListPageComponent],
})
export class FilePagesModule {}
