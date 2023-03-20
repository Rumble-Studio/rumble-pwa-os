import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { Subscription } from '@rumble-pwa/mega-store';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { LayoutService } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';
import { SubscriptionEditorComponent } from '../../elements/subscription-editor/subscription-editor.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-subscription-list-page',
	templateUrl: './subscription-list-page.component.html',
	styleUrls: ['./subscription-list-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionListPageComponent {
	sortMethod = 0;
	layoutSize = 2;

	subscriptions: Subscription[] = [];

	constructor(
		public dialog: MatDialog,
		private layoutService: LayoutService,
		private subscriptionsManagementService: SubscriptionsManagementService,
		private cdr: ChangeDetectorRef,
		private _layoutRepository: LayoutRepository
	) {
		this.layoutService.layoutSize$$.subscribe((value) => {
			this.layoutSize = value;
		});
		this.subscriptionsManagementService.subscriptions$$
			.pipe(
				untilDestroyed(this),
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Subscriptions',
					link: undefined,
				},
			],
		});
	}

	openDialog() {
		this.dialog.open(SubscriptionEditorComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
		});
	}

	private _check(timeOut = 0) {
		setTimeout(() => {
			this.cdr.detectChanges();
		}, timeOut);
	}
}
