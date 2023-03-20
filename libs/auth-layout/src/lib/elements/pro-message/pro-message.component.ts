import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LayoutService } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-pro-message',
	templateUrl: './pro-message.component.html',
	styleUrls: ['./pro-message.component.scss'],
})
export class ProMessageComponent {
	layoutSize = 2;

	constructor(private layoutService: LayoutService) {
		// layout state
		this.layoutService.layoutSize$$
			.pipe(
				untilDestroyed(this),
				tap((layoutSize) => (this.layoutSize = layoutSize))
			)
			.subscribe();
	}
}
