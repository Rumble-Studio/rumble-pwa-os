import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GrantsManagementService } from '@rumble-pwa/groups-system';
import { Grant } from '@rumble-pwa/mega-store';
import { sortBy } from 'lodash';
import { AddGrantComponent } from '../add-grant/add-grant.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-grants-list',
	templateUrl: './grants-list.component.html',
	styleUrls: ['./grants-list.component.scss'],
})
export class GrantsListComponent {
	// Table Data
	public dataSource: MatTableDataSource<Grant> = new MatTableDataSource();

	// Table Config
	public displayedColumns: string[] = ['state', 'id', 'timeCreation', 'permission', 'groupId', 'parameters', 'methodName'];

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
	constructor(private grantsManagementService: GrantsManagementService, private dialog: MatDialog) {
		this.grantsManagementService
			.getAll$(true)
			.pipe(untilDestroyed(this))
			.subscribe((grants) => {
				// const previousFilter = this.dataSource.filter;
				this.dataSource = new MatTableDataSource(sortBy(grants, 'timeCreation').reverse());
				this.setDataSourceParameters();
			});
	}

	applyFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}
	onAddGrant() {
		this.dialog.open(AddGrantComponent, {
			minWidth: '280px',
			width: '100%',
			maxWidth: '500px',
		});
	}

	onUpdateGrant(grant: Grant) {
		this.dialog.open(AddGrantComponent, { data: { grant: grant } });
	}

	setDataSourceParameters() {
		// paginator
		this.dataSource.paginator = this.paginator;

		// sort
		this.dataSource.sort = this.sort;

		// filter predicate
		this.dataSource.filterPredicate = (grant: Grant, filter: string) => {
			return (
				(
					grant.permissionId.toLowerCase() +
					(grant.parameters || '').toLowerCase() +
					(grant.methodName || '').toLowerCase() +
					grant.groupId.toLowerCase()
				).indexOf(filter.toLowerCase()) != -1
			);
		};

		// sorting accessor
		this.dataSource.sortingDataAccessor = (grant: Grant, propertyNameAsString: string) => {
			const propertyName = propertyNameAsString as keyof Grant;

			if (typeof grant[propertyName] === 'string') {
				return (grant[propertyName] as string).toLowerCase();
			}

			if (typeof grant[propertyName] === 'number') {
				return grant[propertyName] as number;
			}

			return grant[propertyName] ? 1 : 0;
		};
	}
}
