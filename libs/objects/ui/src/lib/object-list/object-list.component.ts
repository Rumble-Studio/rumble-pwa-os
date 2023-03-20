/* eslint-disable @angular-eslint/component-selector */
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ContentChildren,
	EventEmitter,
	Input,
	Output,
	QueryList,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ContentLoaderComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { debounceTime, startWith, tap } from 'rxjs/operators';
import { ObjectColumnComponent } from './object-column.component';

export interface TableClickEvent<T> {
	object?: T;
	columnId?: string;
}

export interface ObjectList {
	__selected?: boolean;
}

@UntilDestroy()
@Component({
	selector: 'object-list',
	standalone: true,
	imports: [
		//
		CommonModule,
		MatTableModule,
		MatFormFieldModule,
		MatPaginatorModule,
		MatCardModule,
		MatInputModule,
		MatSortModule,
		ObjectColumnComponent,
		RouterModule,
		MatCheckboxModule,
		FormsModule,
		ContentLoaderComponent,
		TrackClickDirective,
		DragDropModule,
	],
	templateUrl: './object-list.component.html',
	styleUrls: ['./object-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('detailExpand', [
			state('collapsed', style({ height: '0px', minHeight: '0' })),
			state('expanded', style({ height: '*' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
		]),
	],
})
export class ObjectListComponent<T>
	extends LayoutSizeAndCheck
	implements AfterViewInit, CanCheck, HasLayoutSize, CanBeDebugged
{
	dataLoaded = false;

	/** If true: add `mat-elevation-z8` class to the div containting table element  */
	@Input()
	elevatedClass = true;

	@ContentChildren(ObjectColumnComponent) columns: QueryList<ObjectColumnComponent> = new QueryList<ObjectColumnComponent>();

	@ViewChild('input') input?: HTMLInputElement;
	@ViewChild(MatTable) table?: MatTable<T>;

	@Input()
	pageSize = 10;
	pageSizeOptions = [5, 10, 25, 100];

	displayedColumns: string[] = [];
	searchableProperties: (keyof T)[] = [];

	searchPlaceholder = 'Search';
	dataSource: MatTableDataSource<T> = new MatTableDataSource([] as T[]);

	_objects: T[] = [];
	get objects() {
		return this._objects;
	}
	@Input()
	set objects(newObjects: T[] | undefined) {
		this.dataLoaded = true;
		if (!newObjects) return;
		this._objects = newObjects;
		this.dataSource.data = newObjects;
		this.setDataSourceParameters();
	}

	/** List of expanded elements */
	expandedElements: T[] = [];

	/** List of selected elements */
	selectionModel: SelectionModel<T>;

	public get selection() {
		return this.selectionModel.selected;
	}
	@Input()
	public set selection(newSelection: T[]) {
		this.selectionModel.clear();
		this.selectionModel.select(...newSelection);
		this._check();
	}

	@Output()
	selectionChange: EventEmitter<T[]> = new EventEmitter<T[]>();

	@Input() expandedTemplate?: TemplateRef<HTMLElement>;
	@Input() titleTpl?: TemplateRef<HTMLElement>;
	@Input() topLeftActionTpl?: TemplateRef<HTMLElement>;
	@Input() middleActionTpl?: TemplateRef<HTMLElement>;
	@Input() topRightActionTpl?: TemplateRef<HTMLElement>;
	@Input() noDataSourceTpl?: TemplateRef<HTMLElement>;

	@Input() multipleExpandedRows = true;

	private _searchValue = '';
	public get searchValue() {
		return this._searchValue;
	}
	@Input()
	public set searchValue(newSearchValue) {
		this._searchValue = newSearchValue;
		this.dataSource.filter = newSearchValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	private _hideColumns: string[] = [];
	public get hideColumns(): string[] {
		return this._hideColumns;
	}
	/** If set: do not display columns for which the id is in this list */
	@Input()
	public set hideColumns(value: string[]) {
		this._hideColumns = value;
		this._updateDisplayedColumns(this.columns.toArray());
	}

	_paginator?: MatPaginator;
	get paginator() {
		return this._paginator;
	}

	@ViewChild(MatPaginator)
	set paginator(newPaginator) {
		if (newPaginator === this._paginator) return;
		this._paginator = newPaginator;
		this.setDataSourceParameters();
	}

	_sort?: MatSort;
	get sort() {
		return this._sort;
	}
	@ViewChild(MatSort)
	set sort(newSort) {
		if (newSort == this._sort) return;
		this._sort = newSort;
		this.setDataSourceParameters();
	}

	@Output() tableClickEvent = new EventEmitter<TableClickEvent<T>>();

	private _allowSelection: boolean = false;
	public get allowSelection(): boolean {
		return this._allowSelection;
	}
	@Input()
	public set allowSelection(value: boolean) {
		this._allowSelection = value;
		this._updateDisplayedColumns(this.columns.toArray());
	}
	@Input() maxObjectsSelected: number = -1;
	@Input() connectDropTo: string[] = [];
	@Input() dropData: any[] = [];

	@Input()
	generateRowClasses: (object: T, defaultClasses: { [className: string]: boolean }) => { [className: string]: boolean } = (
		object: T,
		defaultClasses
	) => {
		return defaultClasses;
	};

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private _notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activateRoute);

		this.selectionModel = new SelectionModel<T>(true, []);
		this.selectionModel.changed
			.pipe(
				untilDestroyed(this),
				debounceTime(100),
				tap(() => {
					console.log('object list, selection changed', this.selectionModel.selected.length);

					this.selectionChange.emit(this.selectionModel.selected);
					this._check();
				})
			)
			.subscribe();
	}

	processClickEvent(object: T, columnId?: string) {
		// No need to emit click event if expandable is true
		// if (this.expandedTemplate) return;
		this.tableClickEvent.emit({ object, columnId });
	}

	ngAfterViewInit() {
		this.setDataSourceParameters();

		this.columns.changes.pipe(startWith(this.columns), untilDestroyed(this)).subscribe((columns) => {
			this._updateDisplayedColumns(columns);
		});
	}

	private _updateDisplayedColumns(columns: ObjectColumnComponent[]) {
		const objectColumns = columns
			.map((column: ObjectColumnComponent) => column.columnId)
			.filter((columnId: string) => this.hideColumns.indexOf(columnId) == -1);

		// add internal select column if required
		this.displayedColumns = this.allowSelection ? ['__select', ...objectColumns] : [...objectColumns];
	}

	setDataSourceParameters() {
		// paginator
		if (this.paginator) this.dataSource.paginator = this.paginator;

		// sort
		if (this.sort) this.dataSource.sort = this.sort;

		// filter predicate
		this.dataSource.filterPredicate = (object: T, filter: string) =>
			this.convertObjectToSearchableString(object).toLowerCase().indexOf(filter.toLowerCase()) != -1;

		// sorting accessor
		this.dataSource.sortingDataAccessor = (object: T, propertyNameAsString: string) =>
			this.convertObjectToSortableElement(object, propertyNameAsString);

		this.dataSource.filter = this._searchValue;
		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}

		this.table?.renderRows();

		this._check();
	}

	@Input()
	convertObjectToSortableElement(object: T, propertyNameAsString: string) {
		// check that propertyName is key of object
		if (!(propertyNameAsString in object)) {
			// return
			throw new Error(`Could not find property ${propertyNameAsString} in object`);
		}

		const propertyName = propertyNameAsString as keyof T;

		if (typeof object[propertyName] === 'string') {
			return (object[propertyName] as unknown as string).toLowerCase();
		}
		if (typeof object[propertyName] === 'number') {
			return object[propertyName] as unknown as number;
		}
		return object[propertyName] ? 1 : 0;
	}

	@Input()
	convertObjectToSearchableString(object: T): string {
		const searchableProperties = this.searchableProperties.length
			? this.searchableProperties
			: (this.displayedColumns as (keyof T)[]);
		return searchableProperties
			.map((property) => {
				if (typeof object[property] === 'string') {
					return object[property] as unknown as string;
				}
				if (typeof object[property] === 'number') {
					return object[property] as unknown as number;
				}
				return '';
			})
			.join(' ');
	}

	toggleExpand(object: T) {
		const index: number = this.expandedElements.findIndex((expandedElement: T) => expandedElement === object);
		if (this.multipleExpandedRows) {
			if (index < 0) {
				this.expandedElements.push(object);
			} else {
				this.expandedElements.splice(index, 1);
			}
		} else {
			this.expandedElements = index < 0 ? [object] : [];
		}
	}

	/** Whether the number of selected elements matches the total number of rows. */
	isAllSelected() {
		const numSelected = this.selectionModel.selected.length;
		const numRows = this.dataSource.data.length;
		const isAllSelected = numSelected === numRows && numRows > 0;
		// console.log('Is all selected ?', isAllSelected);
		return isAllSelected;
	}

	/** Selects all rows if they are not all selected; otherwise clear selection. */
	toggleAllRows() {
		if (this.isAllSelected()) {
			console.log('Clearing selection');

			this.selectionModel.clear();
			return;
		}
		console.log('Selection all data');

		// allow all selection only if no limit or under limit
		if (this.maxObjectsSelected <= 0 || this.dataSource.data.length <= this.maxObjectsSelected)
			this.selectionModel.select(...this.dataSource.data);
		this._check();
	}

	/** The label for the checkbox on the passed row */
	checkboxLabel(row?: T): string {
		if (!row) {
			return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
		}
		return `${this.selectionModel.isSelected(row) ? 'deselect' : 'select'} row`;
	}

	public selectObject(object: T, event: MatCheckboxChange) {
		console.log('(selectObject)', event);
		if (event.checked) {
			this.selectionModel.select(object);
			if (this.selectionModel.selected.length > this.maxObjectsSelected) {
				this._notificationsService.warning('You can only select ' + String(this.maxObjectsSelected) + ' elements.');
				event.source.checked = false;
				this.selectionModel.deselect(object);
				return;
			}
		} else {
			this.selectionModel.deselect(object);
		}
	}

	public isObjectSelected(object: T) {
		return this.selectionModel.isSelected(object);
	}
}
