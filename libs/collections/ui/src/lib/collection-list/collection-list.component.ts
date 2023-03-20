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
import { Collection } from '@rumble-pwa/collections/models';
import { CollectionsRepository } from '@rumble-pwa/collections/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { ObjectColumnComponent, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-collection-list',
	templateUrl: './collection-list.component.html',
	styleUrls: ['./collection-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		//MAT
		MatSlideToggleModule,
		MatMenuModule,
		MatIconModule,
		MatButtonModule,
		// STANDALONE
		ObjectListComponent,
		ObjectColumnComponent,
		TrackClickDirective,
	],
})
export class CollectionListComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	@Input()
	collections: Collection[] = [];

	@Input()
	displayArchivedToggle = true;

	private _displayArchivedCollections = false;
	public get displayArchivedCollections(): boolean {
		return this._displayArchivedCollections;
	}

	@Input()
	public set displayArchivedCollections(value: boolean) {
		this._displayArchivedCollections = value;
		this.displayArchivedCollectionsChange.emit(value);
	}

	@Output()
	tableClickEventEmitter = new EventEmitter<TableClickEvent<any>>();
	@Output()
	displayArchivedCollectionsChange = new EventEmitter<boolean>();

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _notificationsService: NotificationsService,
		private _collectionsRepository: CollectionsRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	editCollection(collection: Collection) {
		this._collectionsRepository
			.openPromptEditor({ collection: collection, collectionId: collection.id })
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}

	archiveCollection(collection: Collection) {
		this._notificationsService.confirm().subscribe((result) => {
			if (result) {
				this._collectionsRepository.updateCollection(collection.id, { state: 'archived' });
				this._check();
			}
		});
	}

	restoreCollection(collection: Collection) {
		this._collectionsRepository.updateCollection(collection.id, { state: 'default' });
		this._notificationsService.success('Your collection has been restored');
		this._check();
	}

	deleteCollection(collection: Collection) {
		this._notificationsService
			.confirmWithInput('Delete "' + collection.title + '"', 'This deletion is permanent.', collection.title)
			.subscribe((result) => {
				if (result) {
					this._collectionsRepository.updateCollection(collection.id, { state: 'deleted' });
					this._check();
				}
			});
	}
	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		this.tableClickEventEmitter.emit(tableClickEvent);
	}
}
