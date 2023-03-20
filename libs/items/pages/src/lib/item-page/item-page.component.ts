import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ImageComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Collection } from '@rumble-pwa/collections/models';
import { CollectionsRepository } from '@rumble-pwa/collections/state';
import { convertMacroKindsToAcceptedExtensionsString, EntityFile, MacroFileKindDefined } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Item } from '@rumble-pwa/items/models';
import { ItemsRepository } from '@rumble-pwa/items/state';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FilePlayerComponent } from '@rumble-pwa/player/specialised';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-item-page',
	templateUrl: './item-page.component.html',
	styleUrls: ['./item-page.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		//MAT
		MatIconModule,
		MatButtonModule,
		MatMenuModule,
		MatChipsModule,
		MatDividerModule,
		//STANDALONE
		FilePlayerComponent,
		ImageComponent,
		TrackClickDirective,
	],
})
export class ItemPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	item$$$ = new DataObsViaId<Item>((itemId: string) => this._itemsRepository.get$(itemId));
	artworkUrl?: string;
	availableCollections: Collection[] = [];
	itemsForTopMenu: Item[] = [];

	// for artwork drop
	_acceptedFileKinds: MacroFileKindDefined[] = ['image'];
	acceptedFileExtensionsString = convertMacroKindsToAcceptedExtensionsString(this._acceptedFileKinds);

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _itemsRepository: ItemsRepository,
		private _collectionsRepository: CollectionsRepository,
		private _filesRepository: FilesRepository,
		private _layoutRepository: LayoutRepository,
		private _usersRepository: UsersRepository,
		private _fileUploadService: FileUploadService,
		private _notificationsService: NotificationsService,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		getRouteParam$(this._activatedRoute, 'itemId')
			.pipe(
				untilDestroyed(this),
				tap((itemId) => {
					this.item$$$.id = itemId;
					this._check();
				})
			)
			.subscribe();

		// convert artwork id to url
		this.item$$$.$.pipe(
			untilDestroyed(this),
			switchMap((collection) => {
				if (collection?.artworkFileId) {
					return this._filesRepository.get$(collection.artworkFileId);
				}
				return of(undefined);
			}),
			switchMap((file) => {
				const artworkSquare = file?.urls?.squareCentered?.url;
				if (!artworkSquare) return this._filesRepository.convertEntityFileIdToUrl$(file?.id);
				this.artworkUrl = artworkSquare;
				this._check();
				return of(undefined);
			}),
			tap((artworkUrl) => {
				if (artworkUrl) this.artworkUrl = artworkUrl;
			})
		).subscribe();

		// fill availale collections to allow insert
		this._collectionsRepository.accessibleCollections$
			.pipe(
				tap((collections) => {
					this.availableCollections = collections.filter((collection) => collection.state === 'default');
				})
			)
			.subscribe();

		// get all items for top list
		this._itemsRepository.accessibleItems$
			.pipe(
				untilDestroyed(this),
				tap((items) => {
					this.itemsForTopMenu = items.filter((item) => item.state === 'default');
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.item$$$.$.pipe(
			untilDestroyed(this),
			tap((item) => {
				if (item) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						displayBurgerMenu: 'auto',
						displaySidebarLeft: 'auto',
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Items',
								link: '/collections',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-items-menu',
							},
							{
								title: item.title + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-item-editor',
								tooltip: 'Edit item properties',
							},
						],
					});
				}
			})
		).subscribe();

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'open-item-editor') {
						this.editItem();
					} else if (event === 'display-other-items-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	editItem() {
		const item = this.item$$$.value;
		if (!item) return;
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

	navigateToItemById(itemId: string) {
		this._router.navigate(['/dashboard', 'items', itemId]);
	}

	removeFileFromItemById() {
		const item = this.item$$$.value;
		if (!item) return;
		this._notificationsService
			.confirm()
			.pipe(untilDestroyed(this))
			.subscribe((confirm) => {
				if (!confirm) return;
				this._itemsRepository.updateItem(item.id, { fileId: undefined });
			});
	}

	public addCollectionToItem(collectionId: string) {
		const item = this.item$$$.value;
		if (!item) return;
		this._itemsRepository.addItemToCollection(item.id, collectionId);
	}

	public unlistCollectionFromItem(collectionId: string, index: number) {
		const itemId = this.item$$$.value?.id;
		if (!itemId) return;
		this._itemsRepository.unlistItemFromCollection(collectionId, index);
	}

	public goToCollection(collectionId: string) {
		this._router.navigate(['/dashboard', 'collections', collectionId]);
	}

	public deleteArtwork() {
		const item = this.item$$$.value;
		if (!item) return;
		this._notificationsService
			.confirm()
			.pipe(untilDestroyed(this))
			.subscribe((confirm) => {
				if (!confirm) return;
				this._itemsRepository.updateItem(item.id, { artworkFileId: undefined });
			});
	}

	/**
	 * Called when dropping files or filling the hidden input
	 * @param fileList
	 * @returns
	 */
	public handleArtworkFileList(event: any) {
		const fileList: ArrayLike<File> = event ? (event.target.files as FileList) : [];
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;
		const preExistingFiles = Array.from(fileList);
		const kind: string[] = ['image'];

		this._filesRepository.accessibleEntityFiles$
			.pipe(
				take(1),
				switchMap((accessibleEntityFiles) => {
					const eligibleFiles: EntityFile[] = accessibleEntityFiles.filter(
						(entityFile) => kind.indexOf(entityFile.kind ?? '') > -1
					);
					return this._fileUploadService.askUserForEntityFiles$(
						ownerId,
						this._acceptedFileKinds,
						1,
						'Upload an image',
						undefined,
						preExistingFiles,
						true, // withURls
						eligibleFiles
					);
				}),
				tap((result) => {
					if (result && result[0] && this.item$$$.id) {
						this._itemsRepository.updateItem(this.item$$$.id, { artworkFileId: result[0].id });
					}
					this._check();
				})
			)
			.subscribe();
	}

	public getCollectionById(collectionId: string) {
		return this._collectionsRepository.get(collectionId);
	}
}
