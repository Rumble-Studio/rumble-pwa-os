import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Collection } from '@rumble-pwa/collections/models';
import { CollectionsRepository } from '@rumble-pwa/collections/state';
import { CollectionListComponent } from '@rumble-pwa/collections/ui';
import { Item } from '@rumble-pwa/items/models';
import { ItemsRepository } from '@rumble-pwa/items/state';
import { ItemListComponent } from '@rumble-pwa/items/ui';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-collections-list-page',
	templateUrl: './collections-list-page.component.html',
	styleUrls: ['./collections-list-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		CommonModule,
		// MAT
		MatButtonModule,
		MatIconModule,
		// ROUTING
		RouterModule,
		// STANDALONE
		CollectionListComponent,
		ItemListComponent,
		TrackClickDirective,
	],
})
export class CollectionsListPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	// COLLECTIONS
	collections: Collection[] = [];
	private _displayArchivedCollections$$ = new BehaviorSubject(false);
	public get displayArchivedCollections() {
		return this._displayArchivedCollections$$.value;
	}
	@Input()
	public set displayArchivedCollections(value) {
		this._displayArchivedCollections$$.next(value);
	}

	// ITEMS
	items: Item[] = [];
	private displayArchivedItems$$ = new BehaviorSubject(false);
	public get displayArchivedItems() {
		return this.displayArchivedItems$$.value;
	}
	@Input()
	public set displayArchivedItems(value) {
		this.displayArchivedItems$$.next(value);
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _router: Router,
		private _layoutRepository: LayoutRepository,
		private _collectionsRepository: CollectionsRepository,
		private _itemsRepository: ItemsRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// get collections
		combineLatest([this._collectionsRepository.accessibleCollections$, this._displayArchivedCollections$$])
			.pipe(
				untilDestroyed(this),
				tap(([collections, displayArchivedCollections]) => {
					this.collections = sortBy(
						[
							...collections.filter(
								(collection) =>
									(collection.state === 'archived' && displayArchivedCollections) ||
									(collection.state !== 'archived' && collection.state !== 'deleted')
							),
						],
						'timeCreation'
					).reverse();
					this._check();
				})
			)
			.subscribe();

		// get items
		combineLatest([this._itemsRepository.items$, this.displayArchivedItems$$])
			.pipe(
				untilDestroyed(this),
				tap(([items, displayArchivedItems]) => {
					this.items = sortBy(
						[
							...items.filter(
								(item) =>
									(item.state === 'archived' && displayArchivedItems) ||
									(item.state !== 'archived' && item.state !== 'deleted')
							),
						],
						'timeCreation'
					).reverse();
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			displayBurgerMenu: 'auto',
			displaySidebarLeft: 'auto',
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Collections',
					link: undefined,
				},
			],
		});
	}

	openCollectionPrompt() {
		this._collectionsRepository
			.openPromptEditor()
			.pipe(
				untilDestroyed(this),
				tap((collection) => {
					this._check();
					if (collection) this._router.navigate(['/dashboard', 'collections', collection.id]);
				})
			)
			.subscribe();
	}

	openItemPrompt() {
		this._itemsRepository
			.openPromptEditor()
			.pipe(
				untilDestroyed(this),
				tap((item) => {
					this._check();
					if (item) {
						this._router.navigate(['/dashboard', 'items', item.id]);
					}
				})
			)
			.subscribe();
	}

	public processCollectionTableClick(tableClickEvent: TableClickEvent<any>) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate(['/dashboard', 'collections', tableClickEvent.object.id]);
	}

	public processItemTableClick(tableClickEvent: TableClickEvent<any>) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate(['/dashboard', 'items', tableClickEvent.object.id]);
	}
}
