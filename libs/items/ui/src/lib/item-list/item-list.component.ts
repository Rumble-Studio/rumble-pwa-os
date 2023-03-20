import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Item } from '@rumble-pwa/items/models';
import { ItemsRepository } from '@rumble-pwa/items/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { ObjectColumnComponent, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-item-list',
	templateUrl: './item-list.component.html',
	styleUrls: ['./item-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		//MAT
		MatIconModule,
		MatMenuModule,
		MatSlideToggleModule,
		MatButtonModule,
		//STANDALONE
		ObjectListComponent,
		ObjectColumnComponent,
		TrackClickDirective,
	],
})
export class ItemListComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	@Input()
	displayArchivedToggle = true;

	private _displayArchivedItems = false;
	public get displayArchivedItems() {
		return this._displayArchivedItems;
	}
	@Input()
	public set displayArchivedItems(value) {
		this._displayArchivedItems = value;
		this.displayArchivedItemsChange.emit(value);
	}

	private _items: Item[] = [];
	public get items(): Item[] {
		return this._items;
	}
	@Input()
	public set items(value: Item[]) {
		this._items = value;
	}

	@Output()
	tableClickEventEmitter = new EventEmitter<TableClickEvent<any>>();
	@Output()
	displayArchivedItemsChange = new EventEmitter<boolean>();

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private notificationsService: NotificationsService,
		private _itemsRepository: ItemsRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	editItem(item: Item) {
		this._itemsRepository
			.openPromptEditor({ item, itemId: item.id })
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}

	duplicateItemWithConfirmation(item: Item) {
		this.notificationsService.confirm('Duplicate ' + item.title + '?').subscribe((result) => {
			if (result) {
				this.duplicateItem(item);
			}
		});
	}

	duplicateItem(item: Item) {
		const now = Math.round(Date.now() / 1000);

		// 1 duplicate the item itself
		const newItem: Item = {
			...item,
			id: uuidv4(),
			title: `${item.title} (copy)`,
			timeUpdate: now,
			timeCreation: now,
		};
		this._itemsRepository.addItem(newItem);
		this._check();
	}

	archiveItem(item: Item) {
		this.notificationsService.confirm().subscribe((result) => {
			if (result) {
				this._itemsRepository.updateItem(item.id, { state: 'archived' });
				this._check();
			}
		});
	}

	restoreItem(item: Item) {
		this._itemsRepository.updateItem(item.id, { state: 'default' });
		this.notificationsService.success('Your item has been restored');
		this._check();
	}

	deleteItem(item: Item) {
		this.notificationsService.confirm().subscribe((result) => {
			if (result) {
				this._itemsRepository.updateItem(item.id, { state: 'deleted' });
				this._check();
			}
		});
	}

	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		this.tableClickEventEmitter.emit(tableClickEvent);
	}
}
