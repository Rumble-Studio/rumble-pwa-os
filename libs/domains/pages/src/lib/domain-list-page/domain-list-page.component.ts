import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Domain, DomainsRepository } from '@rumble-pwa/domains/state';
import { DomainListComponent } from '@rumble-pwa/domains/ui';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { TodoOpenComponent } from '@rumble-pwa/todo';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-domain-list-page',
	standalone: true,
	imports: [
		//
		CommonModule,
		DomainListComponent,
		MatIconModule,
		RouterModule,
		MatButtonModule,
		TodoOpenComponent,
		TrackClickDirective,
	],
	templateUrl: './domain-list-page.component.html',
	styleUrls: ['./domain-list-page.component.scss'],
})
export class DomainListPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	domains: Domain[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private _domainsRepository: DomainsRepository,
		private _router: Router,
		private _layoutRepository: LayoutRepository
	) {
		super(_cdr, _layoutService, _activateRoute);
		this._domainsRepository.domains$
			.pipe(
				untilDestroyed(this),
				tap((domains) => {
					this.domains = [...domains.filter((domain) => domain.state != 'deleted')];
					console.log({ domains });

					this._check();
				})
			)
			.subscribe();

		// refresh list of domains from server
		this._domainsRepository.fetchFromServer();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			displaySidebarLeft: 'auto',
			displayBurgerMenu: 'auto',
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Domains',
					link: undefined,
				},
			],
		});
	}

	openObjectPrompt() {
		this._domainsRepository
			.openObjectPrompt({
				modalTitle: 'Create a new domain',
				modalSubmitText: 'Create',
			})
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						this._router.navigate(['/domains', result.id]);
					}
				})
			)
			.subscribe();
	}
}
