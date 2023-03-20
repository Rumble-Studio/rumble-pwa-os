import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AdminPanelSystemService } from '@rumble-pwa/admin-panel-system';
import { Task } from '@rumble-pwa/mega-store';
import { TasksManagementService } from '@rumble-pwa/tasks-system';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-tasks-list',
	templateUrl: './tasks-list.component.html',
	styleUrls: ['./tasks-list.component.scss'],
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class TasksListComponent {
	// Table Data
	public dataSource: MatTableDataSource<Task> = new MatTableDataSource();
	public refreshTime!: number; //Displayed in second to avoid value like 1ms
	public expandedElement?: MatTableDataSource<Task>;
	// Table Config
	public displayedColumns: string[] = [
		'id',
		'timeCreation',
		'title',
		'submitted',
		'complete',
		'failed',
		'progress',
		'reload',
		'args',
		'result',
	];

	@ViewChild(MatSort, { static: false }) sort!: MatSort;
	@ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

	constructor(
		private tasksManagementService: TasksManagementService,
		private adminPanelSystemService: AdminPanelSystemService
	) {
		this.tasksManagementService.tasks$$.pipe(untilDestroyed(this)).subscribe((tasks) => {
			const previousFilter = this.dataSource.filter;
			this.dataSource = new MatTableDataSource(tasks);
			this.dataSource.sort = this.sort;
			this.dataSource.paginator = this.paginator;
			this.dataSource.filter = previousFilter;
		});

		if (!this.refreshTime) {
			this.refreshTime = 20;
		}

		this.autoRefreshTasks();
	}

	public onReloadAsk(id: string) {
		this.adminPanelSystemService.onReloadTask(id);
	}

	public onRefreshTask() {
		this.adminPanelSystemService.onRefreshTask();
	}

	private autoRefreshTasks() {
		setTimeout(() => {
			this.adminPanelSystemService.onRefreshTask();
			this.autoRefreshTasks();
		}, this.refreshTime * 1000);
	}

	applyFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}
}
