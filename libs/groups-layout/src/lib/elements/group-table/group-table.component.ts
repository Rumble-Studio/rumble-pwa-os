import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Group } from '@rumble-pwa/mega-store';
import { sortBy } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupPropertiesPromptComponent } from '../group-properties-prompt/group-properties-prompt.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-group-table',
	templateUrl: './group-table.component.html',
	styleUrls: ['./group-table.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupTableComponent {
	filterValue = '';

	flatten$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	private _flatten = false;
	public get flatten() {
		return this._flatten;
	}
	@Input()
	public set flatten(value) {
		this._flatten = value;
		this.flatten$$.next(value);
		this._check();
	}

	// groups: Group[] = [];
	groups$$: BehaviorSubject<Group[]>;

	kind$$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
	private _kind = 'user';
	public get kind() {
		return this._kind;
	}
	@Input()
	public set kind(value) {
		this._kind = value;
		this.kind$$.next(value);
		if (value == 'user') {
			this.displayedColumns = ['name'];
		} else if (value == 'team') {
			this.displayedColumns = ['name'];
		}
		this._check();
	}

	displayedColumns: string[] = ['name'];
	dataSource: MatTableDataSource<Group> = new MatTableDataSource([] as Group[]);

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

	constructor(
		private groupsManagementService: GroupsManagementService,
		public dialog: MatDialog,

		private cdr: ChangeDetectorRef
	) {
		this.groups$$ = this.groupsManagementService.groups$$;
		combineLatest([this.groups$$, this.kind$$, this.flatten$$])
			.pipe(
				untilDestroyed(this),
				map(([groups, kind, flatten]) => {
					return groups.filter((group) => group.kind === kind);
				}),
				map((groups) => {
					if (['folder', 'team'].includes(this.kind) && !this.flatten) {
						// find team/folder without parent of same type
						return groups.filter((group) => this.groupIsARootGroup(group.id, this.kind));
					}
					return groups;
				})
			)
			.subscribe((groups) => {
				// this.groups = groups;
				const orderedGroups = sortBy(groups, 'timeUpdate').reverse();
				this.dataSource = new MatTableDataSource(orderedGroups);
				this.setDataSourceParameters();
			});
	}

	applyFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
		this.filterValue = filterValue;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
		this._check();
	}

	openDialog() {
		this.dialog.open(GroupPropertiesPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { group: undefined, kind: this.kind },
		});
	}

	setDataSourceParameters() {
		// paginator
		this.dataSource.paginator = this.paginator;

		// sort
		this.dataSource.sort = this.sort;

		// filter predicate
		this.dataSource.filterPredicate = (group: Group, filter: string) =>
			this.groupsManagementService.getGroupAsSearchableTerm(group.id).toLowerCase().includes(filter);

		// {
		//   return (
		//     (
		//       group.name.toLowerCase() + (group.description?.toLowerCase() || '')
		//     ).indexOf(filter.toLowerCase()) != -1
		//   );
		// };

		// sorting accessor
		this.dataSource.sortingDataAccessor = (group: Group, propertyNameAsString: string) => {
			const propertyName = propertyNameAsString as keyof Group;

			if (propertyName == 'name') {
				return this.groupsManagementService.getGroupAsSearchableTerm(group.id).toLocaleLowerCase();
			}

			if (typeof group[propertyName] === 'string') {
				return (group[propertyName] as string).toLowerCase();
			}

			if (typeof group[propertyName] === 'number') {
				return group[propertyName] as number;
			}
			return group[propertyName] ? 1 : 0;
		};

		this.dataSource.filter = this.filterValue;

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}

		this._check();
	}

	showableParents(groupId: string): Group[] {
		return this.groupsManagementService.showableParents(groupId);
	}
	groupIsARootGroup(groupId: string, kind: string): boolean {
		return this.groupsManagementService.groupIsARootGroup(groupId, kind);
	}

	private _check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
