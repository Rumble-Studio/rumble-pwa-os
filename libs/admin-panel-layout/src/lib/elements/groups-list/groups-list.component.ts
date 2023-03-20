import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Grant, Group } from '@rumble-pwa/mega-store';
import { AddGroupChildComponent } from '../add-group-child/add-group-child.component';
import { AddGroupParentComponent } from '../add-group-parent/add-group-parent.component';
import { GrantPromptComponent } from '../grant-prompt/grant-prompt.component';
import { GroupPromptComponent } from '../group-prompt/group-prompt.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-groups-list',
	templateUrl: './groups-list.component.html',
	styleUrls: ['./groups-list.component.scss'],
})
export class GroupsListComponent {
	// Table Data
	public dataSource: MatTableDataSource<Group> = new MatTableDataSource();
	groups: Group[] = [];

	// Table Config
	public displayedColumns: string[] = ['id', 'timeCreation', 'name', 'description', 'kind', 'children', 'parents', 'grants'];

	_paginator!: MatPaginator;
	@ViewChild(MatPaginator)
	set paginator(newPaginator: MatPaginator) {
		if (newPaginator === this._paginator) return;
		this._paginator = newPaginator;
		this.setDataSourceParameters();
	}
	get paginator() {
		return this._paginator;
	}

	_sort!: MatSort;
	@ViewChild(MatSort)
	set sort(newSort: MatSort) {
		if (newSort == this._sort) return;
		this._sort = newSort;
		this.setDataSourceParameters();
	}
	get sort() {
		return this._sort;
	}

	constructor(private groupsManagementService: GroupsManagementService, private dialog: MatDialog) {
		this.groupsManagementService.groups$$.pipe(untilDestroyed(this)).subscribe((groups) => {
			this.groups = groups;
			const previousFilter = this.dataSource.filter;
			this.dataSource = new MatTableDataSource(groups);
			this.dataSource.filter = previousFilter;
		});
	}

	applyFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	openGroupModal(groupId: string, isParent: boolean, fromGroup: string) {
		const groupDataEnhance = this.groupsManagementService.get(groupId);
		this.dialog.open(GroupPromptComponent, {
			data: {
				group: groupDataEnhance,
				isParent: isParent,
				fromGroup: fromGroup,
			},
		});
	}

	openGrantModal(grant: Grant) {
		this.dialog.open(GrantPromptComponent, {
			data: {
				grant: grant,
			},
		});
	}

	addParent(group: Group) {
		this.dialog.open(AddGroupParentComponent, {
			data: { group: group },
		});
	}

	addChild(group: Group) {
		this.dialog.open(AddGroupChildComponent, {
			data: { group: group },
		});
	}

	setDataSourceParameters() {
		// paginator
		this.dataSource.paginator = this.paginator;

		// sort
		this.dataSource.sort = this.sort;

		// filter predicate
		this.dataSource.filterPredicate = (group: Group, filter: string) => {
			return (
				(
					'k@' +
					group.kind.toLowerCase() +
					'n@' +
					group.name.toLowerCase() +
					this.groupsManagementService.getGroupAsSearchableTerm(group.id).toLowerCase() +
					'd@' +
					(group.description?.toLowerCase() || '')
				).indexOf(filter.toLowerCase()) != -1
			);
		};

		// sorting accessor
		this.dataSource.sortingDataAccessor = (group: Group, propertyNameAsString: string) => {
			const propertyName = propertyNameAsString as keyof Group;

			if (typeof group[propertyName] === 'string') {
				return (group[propertyName] as string).toLowerCase();
			}
			if (typeof group[propertyName] === 'number') {
				return group[propertyName] as number;
			}
			return group[propertyName] ? 1 : 0;
		};
	}
}
