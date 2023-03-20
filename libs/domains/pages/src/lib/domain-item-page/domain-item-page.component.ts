import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Domain, DomainsRepository } from '@rumble-pwa/domains/state';
import { DomainItemComponent } from '@rumble-pwa/domains/ui';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-domain-item-page',
	standalone: true,
	imports: [
		//
		CommonModule,
		DomainItemComponent,
		MatMenuModule,
		TrackClickDirective,
	],
	templateUrl: './domain-item-page.component.html',
	styleUrls: ['./domain-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainItemPageComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	/**
	 * Domain to display
	 * The domain object isself is used for the page segment even if only the id is given to the domain-item component
	 */
	public domain$$$ = new DataObsViaId<Domain>((domainId: string) => this._domainsRepository.get$(domainId));
	domains: Domain[] = [];

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;
	@ViewChild(DomainItemComponent) domainItem?: DomainItemComponent;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _layoutRepository: LayoutRepository,
		private _domainsRepository: DomainsRepository,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);
		// read param from route
		getRouteParam$(this._activatedRoute, 'id')
			.pipe(
				untilDestroyed(this),
				tap((objectId) => {
					this.domain$$$.id = objectId;
				})
			)
			.subscribe();

		// get all domains for top list
		this._domainsRepository.domains$
			.pipe(
				untilDestroyed(this),
				tap((domains) => {
					this.domains = [...domains];
					console.log({ domains });

					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.domain$$$.$.pipe(
			untilDestroyed(this),
			tap((domain) => {
				if (domain) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						displayBurgerMenu: 'auto',
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Domains',
								link: '/domains',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-domains-menu',
							},
							{
								title: domain.name + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-domain-editor',
								tooltip: 'Edit domain properties',
							},
						],
					});
				}
				this._check();
			})
		).subscribe();

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'open-domain-editor') {
						this.openItemEditor();
					} else if (event === 'display-other-domains-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	openItemEditor() {
		this.domainItem?.openObjectPrompt();
	}

	selectDomain(domainId: string) {
		this._router.navigate(['/domains', domainId]);
	}
}
