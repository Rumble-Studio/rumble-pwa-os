import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { BrokerOptions, BrokerService } from '@rumble-pwa/broker-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { SideNavLink } from '@rumble-pwa/links/models';
import { TodoComponent } from '@rumble-pwa/todo';
import { UpgradeComponent } from '@rumble-pwa/upgrade/ui';
import { debounceTime } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-link-side-nav',
	templateUrl: './link-side-nav.component.html',
	styleUrls: ['./link-side-nav.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		//
		TodoComponent,
		RouterModule,
		CommonModule,
		UpgradeComponent,
		TrackClickDirective,
	],
})
export class LinkSideNavComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	@Input()
	link!: SideNavLink;
	@Input() compactView = false;
	@Input() menuTitle?: string;

	active = false;

	@ViewChild("upgrade") upgrade?: UpgradeComponent;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _brokerService: BrokerService,
		private _router: Router
	) {
		// console.log('%c[LinSideNav](constructor)', 'color: #00a7e1; font-weight: bold');

		super(_cdr, _layoutService, _activatedRoute);

		// update layout repo url (for whitelabel features)
		this._router.events.pipe(untilDestroyed(this), debounceTime(100)).subscribe(() => {
			if (this.link.path && !this.link.path.startsWith('@')) {
				this.active = this._router.isActive(this._router.createUrlTree([this.link.path]), true);
				this._check();
			}
		});
	}

	public processLinkClick(event: any) {
		if (this.link.callback) {
			this.link.callback(event);
		}
		if (!this.link.path) return;
		if (this.link.path.startsWith('@')) {
			// "proxy link"
			this._brokerService.broke(this.link.path.substring(1) as BrokerOptions);
		} else {
			// "normal link"
			this._router.navigate([this.link.path]);
		}
	}
}
