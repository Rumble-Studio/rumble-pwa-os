import { Component, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { Group } from '@rumble-pwa/mega-store';
import { DataObsViaId, getRouteParam$ } from '@rumble-pwa/utils';
import { map, tap } from 'rxjs/operators';
import { GroupItemComponent } from '../../elements/group-item/group-item.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-group-viewer',
	templateUrl: './group-viewer.component.html',
	styleUrls: ['./group-viewer.component.scss'],
})
export class GroupViewerComponent {
	public group$$$ = new DataObsViaId<Group>((groupId: string) => this._groupsManagementService.get$(groupId));

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;
	@ViewChild(GroupItemComponent) groupItem?: GroupItemComponent;

	groupTargets: Group[] = [];

	public get groupId() {
		return this.group$$$.id;
	}
	public set groupId(value) {
		this.group$$$.id = value;
	}
	constructor(
		private activatedRoute: ActivatedRoute,
		private _groupsManagementService: GroupsManagementService,
		private _layoutRepository: LayoutRepository,
		private _router: Router
	) {
		// read param from route
		getRouteParam$(this.activatedRoute, 'groupId')
			.pipe(
				untilDestroyed(this),
				tap((groupId) => {
					this.groupId = groupId;
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.group$$$.$.pipe(
			untilDestroyed(this),
			tap((group) => {
				if (group) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						pageSegments: [
							HOME_SEGMENT,
							{
								title: group.kind === 'team' ? 'Teams' : 'Group',
								link: '/groups',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-groups-menu',
							},
							{
								title: group.name + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-group-editor',
								tooltip: 'Edit collection properties',
							},
						],
					});
				}
			})
		).subscribe();

		this._groupsManagementService.groups$$.pipe(
			map((groups) => {
				this.groupTargets = groups
					.filter((group) => group.kind === 'team')
					.sort((prev, curr) =>
						(prev.timeCreation || 0) < (curr.timeCreation || 0)
							? 1
							: (curr.timeCreation || 0) < (prev.timeCreation || 0)
							? -1
							: 0
					);
			})
		);

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'open-group-editor' && this.group$$$.value) {
						this.openGroupEditor();
					} else if (event === 'display-other-groups-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	openGroupEditor() {
		if (!this.group$$$.value) return;
		this.groupItem?.openGroupPropertiesDialog(this.group$$$.value);
	}

	selectGroup(groupId: string) {
		this._router.navigate(['/dashboard', 'groups', groupId]);
	}
}
