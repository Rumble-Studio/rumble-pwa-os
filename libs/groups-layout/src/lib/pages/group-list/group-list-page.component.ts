import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { LayoutService } from '@rumble-pwa/utils';
import { GroupPropertiesPromptComponent } from '../../elements/group-properties-prompt/group-properties-prompt.component';

@Component({
	selector: 'rumble-pwa-group-list-page',
	templateUrl: './group-list-page.component.html',
	styleUrls: ['./group-list-page.component.scss'],
})
export class GroupListPageComponent {
	layoutSize = 2;

	constructor(
		//:
		public dialog: MatDialog,
		private layoutService: LayoutService,
		private _layoutRepository: LayoutRepository
	) {
		this.layoutService.layoutSize$$.subscribe((value) => {
			this.layoutSize = value;
		});

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Teams & Contacts',
					link: undefined,
				},
			],
		});
	}

	openDialog() {
		this.dialog.open(GroupPropertiesPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { group: undefined },
		});
	}
}
