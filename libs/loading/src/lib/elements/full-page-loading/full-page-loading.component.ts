import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { LoadingService } from '../../loading.service';

@Component({
	selector: 'rumble-pwa-full-page-loading',
	templateUrl: './full-page-loading.component.html',
	styleUrls: ['./full-page-loading.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullPageLoadingComponent {
	loading = false;

	constructor(private loadingService: LoadingService, private cdr: ChangeDetectorRef) {
		this.loadingService.loading$$.subscribe((loading) => {
			this.loading = loading;
			this.cdr.markForCheck();
		});
	}
}
