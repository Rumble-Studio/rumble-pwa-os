import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { SideNavLink } from '@rumble-pwa/links/models';

@Component({
	selector: 'rumble-pwa-menu-bottom-nav',
	templateUrl: './menu-bottom-nav.component.html',
	styleUrls: ['./menu-bottom-nav.component.scss'],
	standalone: true,
	imports: [
		//
		CommonModule,
		RouterModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBottomNavComponent {
	@Input() links: SideNavLink[] = [];
	@Input() compactView = false;
	@Input() showSuperUser = false;
}
