import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { Page, PagesRepository } from '@rumble-pwa/pages/state';
import { PageListComponent } from '@rumble-pwa/pages/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-page-list-page',
	standalone: true,
	imports: [
		//
		CommonModule,
		PageListComponent,
		MatIconModule,
		RouterModule,
		MatButtonModule,
		TrackClickDirective,
	],
	templateUrl: './page-list-page.component.html',
	styleUrls: ['./page-list-page.component.scss'],
})
export class PageListPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	pages: Page[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private _pagesRepository: PagesRepository,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activateRoute);
		this._pagesRepository.pages$
			.pipe(
				untilDestroyed(this),
				tap((pages) => {
					this.pages = sortBy(
						[...pages.filter((page) => page.state != 'deleted')],
						['timeUpdate', 'timeCreation']
					).reverse();

					this._check();
				})
			)
			.subscribe();
	}

	openObjectPrompt() {
		this._pagesRepository
			.openObjectPrompt({ modalTitle: 'Create a new page', modalSubmitText: 'Create' })
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result && result.id) {
						this._router.navigate(['/pages', result.id]);
					}
				})
			)
			.subscribe();
	}
}
