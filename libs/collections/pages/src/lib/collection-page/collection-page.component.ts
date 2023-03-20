import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ImageComponent } from '@rumble-pwa/atomic-system';
import { Category, Collection, Language } from '@rumble-pwa/collections/models';
import { CollectionsRepository } from '@rumble-pwa/collections/state';
import { FilesRepository } from '@rumble-pwa/files/state';
import { ItemsRepository } from '@rumble-pwa/items/state';
import { ItemComponent } from '@rumble-pwa/items/ui';
import { INITIAL_LAYOUT_PROPS, LayoutRepository } from '@rumble-pwa/layout/state';
import { VirtualPlaybarComponent, VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-collection-page',
	templateUrl: './collection-page.component.html',
	styleUrls: ['./collection-page.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		MatChipsModule,
		ImageComponent,
		ItemComponent,
		MatIconModule,
		VirtualPlaylistComponent,
		VirtualPlaybarComponent,
	],
})
export class CollectionPageComponent extends LayoutSizeAndCheck implements CanCheck, CanBeDebugged, HasLayoutSize {
	_collectionId?: string;
	@Input()
	public set collectionId(newCollectionId) {
		this._collectionId = newCollectionId;
		this.collection$$$.id = newCollectionId;
	}
	public get collectionId() {
		return this._collectionId;
	}

	collection$$$ = new DataObsViaId((collectionId: string) => this._collectionsRepository.get$(collectionId));
	artworkUrl?: string;
	language?: Language;

	/**
	 * Collection can be displayed without cnamed redirection, as a public page
	 */
	_publicPage$$ = new BehaviorSubject<boolean>(false);
	@Input()
	public set publicPage(newValue) {
		this._publicPage$$.next(newValue);
	}
	public get publicPage() {
		return this._publicPage$$.value;
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _collectionsRepository: CollectionsRepository,
		private _itemsRepository: ItemsRepository,
		private _filesRepository: FilesRepository,
		private _layoutRepository: LayoutRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		/**
		 * PUBLIC PAGE LOGIC
		 */

		this._activatedRoute.data
			.pipe(
				tap((data) => {
					this.publicPage = !!data['publicPage'];
				})
			)
			.subscribe();

		getRouteParam$(this._activatedRoute, 'collectionId')
			.pipe(
				untilDestroyed(this),
				tap((collectionId) => {
					this.collectionId = collectionId;
					this._check();
				})
			)
			.subscribe();

		combineLatest([this._publicPage$$, this.collection$$$.id$$])
			.pipe(
				switchMap(([publicTarget, collectionId]) => {
					if (publicTarget) {
						this._layoutRepository.setLayoutProps(INITIAL_LAYOUT_PROPS);
					}
					if (publicTarget && collectionId) return this._collectionsRepository.fetchCollectionData$(collectionId);
					else return of(undefined);
				}),
				tap((result) => {
					if (result?.items) {
						result.items.forEach((item) => {
							this._itemsRepository.upsertItem({ ...item, operation: 'refresh' });
						});
					}
					this._check();
				})
			)
			.subscribe();

		/**
		 * END OF PUBLIC PAGE LOGIC
		 */

		/**
		 * Convert artwork id to url
		 */
		this.collection$$$.$.pipe(
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
		/**
		 * Updating language info
		 */
		combineLatest([this._collectionsRepository.collectionProps$, this.collection$$$.$])
			.pipe(
				untilDestroyed(this),
				tap(([props, collection]) => {
					this.language = props.languages.find((language) => language.id === collection?.languageId);
				})
			)
			.subscribe();
	}

	displayValueType(collection: Collection) {
		return this._collectionsRepository.displayValueType(collection);
	}

	displayValueCaterogy(categoryId: Category['id']): string {
		return this._collectionsRepository.displayValueCategory(categoryId);
	}
}
