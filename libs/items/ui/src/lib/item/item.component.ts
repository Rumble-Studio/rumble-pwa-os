import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ImageComponent } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import { Item } from '@rumble-pwa/items/models';
import { ItemsRepository } from '@rumble-pwa/items/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FilePlayerComponent } from '@rumble-pwa/player/specialised';
import { CanBeDebugged, CanCheck, DataObsViaId, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-item',
	templateUrl: './item.component.html',
	styleUrls: ['./item.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		//MAT
		MatMenuModule,
		MatIconModule,
		MatDividerModule,
		MatButtonModule,
		//STANDALONE
		FilePlayerComponent,
		ImageComponent,
		TrackClickDirective,
	],
})
export class ItemComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	item$$$: DataObsViaId<Item> = new DataObsViaId((itemId) => this._itemsRepository.get$(itemId));
	public get itemId(): string | undefined {
		return this.item$$$.id;
	}
	@Input()
	public set itemId(value: string | undefined) {
		this.item$$$.id = value;
	}
	@Input()
	collectionId?: string;
	@Input()
	rank?: number;

	@Input()
	canEdit?: boolean;
	artworkUrl?: string;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _itemsRepository: ItemsRepository,
		private _router: Router,
		public filesRepository: FilesRepository,
		private _notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.item$$$.$.pipe(
			untilDestroyed(this),
			switchMap((collection) => {
				if (collection?.artworkFileId) {
					return this.filesRepository.get$(collection.artworkFileId);
				}
				return of(undefined);
			}),
			switchMap((file) => {
				const artworkSquare = file?.urls?.squareCentered?.url;
				if (!artworkSquare) return this.filesRepository.convertEntityFileIdToUrl$(file?.id);
				this.artworkUrl = artworkSquare;
				this._check();
				return of(undefined);
			}),
			tap((artworkUrl) => {
				if (artworkUrl) this.artworkUrl = artworkUrl;
			})
		).subscribe();
	}

	editItem() {
		const item = this.item$$$.value;
		if (!item) return;
		this._itemsRepository.openPromptEditor({ item, itemId: item.id }).pipe(untilDestroyed(this)).subscribe();
	}

	unlistItemFromCollection(collectionId: string, rank: number) {
		this._notificationsService
			.confirm()
			.pipe(untilDestroyed(this))
			.subscribe((confirm) => {
				if (!confirm) return;
				this._itemsRepository.unlistItemFromCollection(collectionId, rank);
			});
	}

	goToItemPage() {
		if (this.itemId) this._router.navigate(['/dashboard', 'items', this.itemId]);
	}
}
