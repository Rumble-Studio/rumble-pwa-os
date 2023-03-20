import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Domain, DomainsRepository } from '@rumble-pwa/domains/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { ObjectColumnComponent, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-domain-list',
	standalone: true,
	imports: [
		//
		CommonModule,
		ObjectListComponent,
		ObjectColumnComponent,
		MatTooltipModule,
		RouterModule,
		MatIconModule,
		MatButtonModule,
		MatMenuModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './domain-list.component.html',
	styleUrls: ['./domain-list.component.scss'],
})
export class DomainListComponent extends LayoutSizeAndCheck implements CanCheck, CanBeDebugged, HasLayoutSize {
	@Input()
	domains: Domain[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _router: Router,
		private _domainsRepository: DomainsRepository, // for domain deletion
		private _notificationsService: NotificationsService // for delete confirmation
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	public processTableClick(event: TableClickEvent<any>) {
		if (event.object) this._router.navigate(['/domains', event.object?.id]);
	}

	public deleteDomain(domain: Domain) {
		this._notificationsService
			.confirmWithInput(
				'Are you sure to delete this domain?',
				'All pages using this domain will be unavailable to visitors.',
				domain.url
			)
			.subscribe((confirm) => {
				if (confirm) {
					this._domainsRepository.updateDomain(domain.id, {
						state: 'deleted',
					});
				}
			});
	}
}
