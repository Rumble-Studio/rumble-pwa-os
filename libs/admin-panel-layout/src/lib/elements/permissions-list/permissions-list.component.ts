import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PermissionsManagementService } from '@rumble-pwa/groups-system';
import { Permission } from '@rumble-pwa/mega-store';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-permissions-list',
	templateUrl: './permissions-list.component.html',
	styleUrls: ['./permissions-list.component.scss'],
})
export class PermissionsListComponent {
	// Table Data
	public dataSource: MatTableDataSource<Permission> = new MatTableDataSource();

	// Table Config
	public displayedColumns: string[] = ['id', 'timeCreation', 'name', 'description', 'key', 'enabled', 'need_group'];

	@ViewChild(MatSort, { static: false }) sort!: MatSort;
	@ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
	constructor(private permissionsManagementService: PermissionsManagementService) {
		this.permissionsManagementService.permissions$$.pipe(untilDestroyed(this)).subscribe((permissions) => {
			const previousFilter = this.dataSource.filter;
			this.dataSource = new MatTableDataSource(permissions);
			this.dataSource.sort = this.sort;
			this.dataSource.paginator = this.paginator;
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
}
