import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { SideNavLink } from '@rumble-pwa/links/models';
import { UpgradeComponent } from '@rumble-pwa/upgrade/ui';
import { LinkSideNavComponent } from '../link-side-nav/link-side-nav.component';

@Component({
	selector: 'rumble-pwa-menu-side-nav',
	templateUrl: './menu-side-nav.component.html',
	styleUrls: ['./menu-side-nav.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		//
		LinkSideNavComponent,
		MatListModule,
		UpgradeComponent,
		CommonModule,
		TrackClickDirective,
	],
})
export class MenuSideNavComponent {
	@Input() links!: SideNavLink[];
	@Input() compactView = false;
	@Input() showSuperUser = false;
	@Input() showSupportUser = false;
	@Input() menuTitle?: string;
}
