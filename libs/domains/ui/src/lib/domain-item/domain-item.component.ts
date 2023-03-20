import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DownloaderComponent, PillComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Domain, DomainsRepository } from '@rumble-pwa/domains/state';
import { Subscription } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { RestService } from '@rumble-pwa/requests';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { TodoOpenComponent } from '@rumble-pwa/todo';
import { CanBeDebugged, CanCheck, DataObsViaId, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'rumble-pwa-domain-item',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualPlaylistComponent,
		DownloaderComponent,
		RouterModule,
		MatIconModule,
		MatButtonModule,
		PillComponent,
		MatCardModule,
		ClipboardModule,
		TodoOpenComponent,
		TrackClickDirective,
	],
	templateUrl: './domain-item.component.html',
	styleUrls: ['./domain-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainItemComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	domain$$$ = new DataObsViaId<Domain>((domainId: string) => this._domainsRepository.get$(domainId));
	public get domainId() {
		return this.domain$$$.id;
	}
	@Input()
	public set domainId(newObjectId) {
		this.domain$$$.id = newObjectId;
	}

	subscriptions: Subscription[] = [];

	domainValidityMessage = 'Checking...';

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _domainsRepository: DomainsRepository,
		private _subscriptionsManagementService: SubscriptionsManagementService,
		private _restService: RestService,
		private _notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.domain$$$.$.pipe(
			untilDestroyed(this),
			tap(() => {
				this._check();
				if (this.domain$$$.value) {
					this.refreshDomainValidity();
				}
			})
		).subscribe();

		// get all subscriptions
		this._subscriptionsManagementService
			.getAll$()
			.pipe(
				untilDestroyed(this),
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
					this._check();
				})
			)
			.subscribe();
	}

	/**
	 * Open the object prompt to edit the domain
	 */

	openObjectPrompt() {
		const domain = this.domain$$$.value;
		if (!domain) return;

		this._domainsRepository
			.openObjectPrompt({ domainId: domain.id, domain: domain })
			.pipe(untilDestroyed(this))
			.subscribe();
	}

	/**
	 * Ask backend to check for Domain validity
	 */
	public refreshDomainValidity() {
		this.domainValidityMessage = 'Checking...';
		this._restService
			.get<{
				status: 'success' | 'error';
				message: string;
				result: any;
			}>(`/domains/${this.domainId}/check`)
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					console.log('DomainItemComponent.refresh(): result', result);
					this.domainValidityMessage = result.message;
					this._check();
				}),
				catchError((error) => {
					console.error('DomainItemComponent.refresh(): error', error);
					this.domainValidityMessage = error.error.message ?? 'An error occured. Please try again later.';
					this._check();
					return of(error);
				})
			)
			.subscribe();
	}

	processCopyToClipboardEvent(copied: boolean) {
		if (copied) {
			this._notificationsService.success('Content copied!', undefined, undefined, undefined, 1000);
		} else {
			this._notificationsService.error('Error while copying');
		}
	}
}
