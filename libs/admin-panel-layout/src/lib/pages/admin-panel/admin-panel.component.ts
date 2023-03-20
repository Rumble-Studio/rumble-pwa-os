import { Location } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { getRouteQueryParam$ } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-admin-panel',
	templateUrl: './admin-panel.component.html',
	styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelLayoutComponent implements AfterViewInit {
	@ViewChild('matTabGroup', { static: false }) matTabGroup!: MatTabGroup;

	tabIndex = 0;

	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private location: Location,
		private _layoutRepository: LayoutRepository
	) {
		getRouteQueryParam$(this.activatedRoute, 'tab')
			.pipe(
				untilDestroyed(this),
				tap((tabIndexStr) => {
					if (tabIndexStr) {
						const tabIndex = parseInt(tabIndexStr, 10);
						if (!isNaN(tabIndex)) {
							this.tabIndex = tabIndex;
							this.goToTab(tabIndex);
						}
					}
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Admin',
				},
			],
		});
	}

	ngAfterViewInit() {
		this.goToTab(this.tabIndex);
	}

	public goToTab(tabIndex: number) {
		const tabGroup = this.matTabGroup;
		if (!tabGroup || !(tabGroup instanceof MatTabGroup)) return;
		tabGroup.selectedIndex = tabIndex;
	}

	updateQueryParam(param: string, value?: string) {
		const queryParams: Params = { [param]: value };
		const url = this.router
			.createUrlTree([], {
				relativeTo: this.activatedRoute,
				queryParams,
			})
			.toString();
		this.location.go(url);
	}

	tabChanged(tabChangeEvent: MatTabChangeEvent): void {
		this.updateQueryParam('tab', '' + tabChangeEvent.index);
	}
}
