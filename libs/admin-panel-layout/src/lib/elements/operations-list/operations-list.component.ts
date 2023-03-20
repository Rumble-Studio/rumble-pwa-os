import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OperationsManagementService } from '@rumble-pwa/groups-system';
import { Operation } from '@rumble-pwa/mega-store';
import { OperationPromptComponent } from '../operation-prompt/operation-prompt.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-operations-list',
	templateUrl: './operations-list.component.html',
	styleUrls: ['./operations-list.component.scss'],
})
export class OperationsListComponent {
	// Table Data
	public dataSource: MatTableDataSource<Operation> = new MatTableDataSource();

	// Table Config
	public displayedColumns: string[] = ['id', 'timeCreation', 'name', 'description', 'kind', 'details', 'key', 'groupId'];

	@ViewChild(MatSort, { static: false }) sort!: MatSort;
	@ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

	constructor(private operationsManagementService: OperationsManagementService, private dialog: MatDialog) {
		this.operationsManagementService.operations$$.pipe(untilDestroyed(this)).subscribe((operations) => {
			const previousFilter = this.dataSource.filter;
			this.dataSource = new MatTableDataSource(operations);
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

	onAddOperation() {
		this.dialog.open(OperationPromptComponent);
	}

	onUpdateOperation(operation: Operation) {
		this.dialog.open(OperationPromptComponent, {
			data: { operation },
		});
	}
}
