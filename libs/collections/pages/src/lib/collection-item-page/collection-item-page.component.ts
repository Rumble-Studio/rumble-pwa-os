import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Item } from '@rumble-pwa/items/models';
import { ItemsRepository } from '@rumble-pwa/items/state';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { combineLatest, of } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ImageComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Category, Collection, Language } from '@rumble-pwa/collections/models';
import { CollectionProps, CollectionsRepository } from '@rumble-pwa/collections/state';
import { convertMacroKindsToAcceptedExtensionsString, EntityFile, MacroFileKindDefined } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { ItemComponent } from '@rumble-pwa/items/ui';
import { UsersRepository } from '@rumble-pwa/users/state';
@UntilDestroy()
@Component({
	selector: 'rumble-pwa-collection-item-page',
	templateUrl: './collection-item-page.component.html',
	styleUrls: ['./collection-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		//MAT
		MatMenuModule,
		MatIconModule,
		MatButtonModule,
		MatChipsModule,
		DragDropModule,
		ClipboardModule,
		// STANDALONE
		ItemComponent,
		ImageComponent,
		TrackClickDirective,
	],
})
export class CollectionItemPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	collection$$$ = new DataObsViaId<Collection>((collectionId: string) => this._collectionsRepository.get$(collectionId));
	artworkUrl?: string;

	// for artwork drop
	_acceptedFileKinds: MacroFileKindDefined[] = ['image'];
	acceptedFileExtensionsString = convertMacroKindsToAcceptedExtensionsString(this._acceptedFileKinds);

	/** map collection.languageId to the full Language object */
	currentLanguage?: Language;

	collectionProps?: CollectionProps;

	collectionsForTopMenu: Collection[] = [];

	// itemsWithRanks: ItemWithRank[] = [];
	candidateItemsToAddToCollection: Item[] = [];

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;

	rssFeedLink?: string;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _collectionsRepository: CollectionsRepository,
		private _itemsRepository: ItemsRepository,
		private _layoutRepository: LayoutRepository,
		private _notificationsService: NotificationsService,
		private _router: Router,
		private _filesRepository: FilesRepository,
		private _usersRepository: UsersRepository,
		private _fileUploadService: FileUploadService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// convert artwork id to url
		this.collection$$$.$.pipe(
			untilDestroyed(this),
			switchMap((collection) => {
				if (collection?.artworkFileId) {
					return this._filesRepository.get$(collection.artworkFileId);
				}
				return of(undefined);
			}),
			switchMap((entityFile) => {
				const artworkSquare = entityFile?.urls?.squareCentered?.url;
				if (!artworkSquare) return this._filesRepository.convertEntityFileIdToUrl$(entityFile?.id);
				this.artworkUrl = artworkSquare;
				this.rssFeedLink = this.getRSSFeedXMLLink();
				this._check();
				return of(undefined);
			}),
			tap((artworkUrl) => {
				if (artworkUrl) this.artworkUrl = artworkUrl;
			})
		).subscribe();

		// getting collection props for other info
		this._collectionsRepository.collectionProps$
			.pipe(
				tap((collectionProps) => {
					this.collectionProps = collectionProps;
				})
			)
			.subscribe();

		getRouteParam$(this._activatedRoute, 'collectionId')
			.pipe(
				untilDestroyed(this),
				tap((collectionId) => {
					this.collection$$$.id = collectionId;
					this._check();
				})
			)
			.subscribe();

		// getting items candidates
		this._itemsRepository.accessibleItems$
			.pipe(
				untilDestroyed(this),
				tap(
					(accessibleItems) =>
						(this.candidateItemsToAddToCollection = accessibleItems.filter(
							(accessibleItem) => accessibleItem.state === 'default'
						))
				)
			)
			.subscribe();

		// updating language info
		combineLatest([this._collectionsRepository.collectionProps$, this.collection$$$.$])
			.pipe(
				untilDestroyed(this),
				tap(([props, collection]) => {
					this.currentLanguage = props.languages.find((language) => language.id === collection?.languageId);
				})
			)
			.subscribe();

		// get all collections for top list
		this._collectionsRepository.accessibleCollections$
			.pipe(
				untilDestroyed(this),
				tap((collections) => {
					this.collectionsForTopMenu = collections.filter((collection) => collection.state === 'default');
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.collection$$$.$.pipe(
			untilDestroyed(this),
			tap((collection) => {
				if (collection) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						displayBurgerMenu: 'auto',
						displaySidebarLeft: 'auto',
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Collections',
								link: '/collections',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-collections-menu',
							},
							{
								title: collection.title + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-collection-editor',
								tooltip: 'Edit collection properties',
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
					if (event === 'open-collection-editor') {
						this.editCollection();
					} else if (event === 'display-other-collections-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	editCollection() {
		const collection = this.collection$$$.value;
		if (!collection) return;
		this._collectionsRepository
			.openPromptEditor({ collection, collectionId: collection.id })
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}

	getRSSFeedXMLLink() {
		const collectionId = this.collection$$$.id;
		if (!collectionId) return;
		return this._collectionsRepository.getRSSFeedXMLLink(collectionId);
	}

	addItemToCollection(itemId: string) {
		const collectionId = this.collection$$$.value?.id;
		if (!collectionId) return;
		this._itemsRepository.addItemToCollection(itemId, collectionId);
	}

	displayValueType(collection: Collection) {
		return this._collectionsRepository.displayValueType(collection);
	}

	displayValueCaterogy(categoryId: Category['id']): string {
		return this._collectionsRepository.displayValueCategory(categoryId);
	}

	selectCollection(collectionId: string) {
		this._router.navigate(['/dashboard', 'collections', collectionId]);
	}

	processCopyToClipboardEvent(copied: boolean, message = 'Copied to clipboard!') {
		if (copied) {
			this._notificationsService.success(message, undefined, undefined, undefined, 1000);
		} else {
			this._notificationsService.error('Error while copying');
		}
	}

	drop(event: CdkDragDrop<any, any, any>) {
		const collection = this.collection$$$.value;
		if (!collection) return;
		const ranks = this.collection$$$.value?.ranks;
		if (!ranks) return;
		// const item = event.item.data.item;
		const previousRank = event.previousIndex;
		const newRank = event.currentIndex;
		// const itemId = item.id;
		// if (!item || !collectionId) return;

		// To avoid flickering effect
		moveItemInArray(ranks, previousRank, newRank);
		this.collection$$$.value = { ...collection, ranks };

		this._itemsRepository.updateItemRankInCollection(collection.id, previousRank, newRank);
	}

	public deleteArtwork() {
		const collection = this.collection$$$.value;
		if (!collection) return;
		this._notificationsService
			.confirm()
			.pipe(untilDestroyed(this))
			.subscribe((confirm) => {
				if (!confirm) return;
				this._collectionsRepository.updateCollection(collection.id, { artworkFileId: undefined });
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
					if (result && result[0] && this.collection$$$.id) {
						this._collectionsRepository.updateCollection(this.collection$$$.id, { artworkFileId: result[0].id });
					}
					this._check();
				})
			)
			.subscribe();
	}

	public createNewItemForCollection() {
		this._itemsRepository
			.openPromptEditor()
			.pipe(
				untilDestroyed(this),
				tap((rItem) => console.log({ r: rItem }))
			)
			.subscribe();
	}

	public openCollectionPublicPage(collectionPublicPageUrl: string) {
		window.open(collectionPublicPageUrl, '_blank');
	}
}
