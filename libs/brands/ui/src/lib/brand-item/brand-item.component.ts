/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
	ColorsPickerComponent,
	ExplanationComponent,
	FontsPickerComponent,
	ImageComponent,
	PillComponent,
} from '@rumble-pwa/atomic-system';
import { AudioPacksListComponent } from '@rumble-pwa/brands/audio-packs';
import {
	AudioPack,
	AudioPackItem,
	Brand,
	BrandData,
	BrandsRepository,
	convertBrandToBrandColors,
	convertColorListToBrandColors,
} from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { convertEntityFileToUrl, EntityFile } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { ObjectsPickerComponent } from '@rumble-pwa/objects/prompt';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	Bss$$,
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { isEqual, uniq } from 'lodash';
import { combineLatest, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-brand-item',
	templateUrl: './brand-item.component.html',
	styleUrls: ['./brand-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		FontsPickerComponent,
		MatIconModule,
		CommonModule,
		RouterModule,
		MatDividerModule,
		MatButtonModule,
		AudioPacksListComponent,
		ColorsPickerComponent,
		ObjectsPickerComponent,
		PillComponent,
		ExplanationComponent,
		MatMenuModule,
		ImageComponent,
		TrackClickDirective,
	],
	standalone: true,
})
export class BrandItemComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	brand$$$ = new DataObsViaId<Brand>((brandId: string) => this._brandsRepository.get$(brandId));

	/** brand images: List of URIs (containing rs://) */
	private _imageURIs$$$ = new Bss$$<string[]>([]);
	private _imageThumbnails: ObjectThumbnail<EntityFile>[] = [];
	public get imageThumbnails(): ObjectThumbnail<EntityFile>[] {
		return this._imageThumbnails;
	}
	public set imageThumbnails(value: ObjectThumbnail<EntityFile>[]) {
		if (isEqual(value, this._imageThumbnails)) return;
		console.log('New image thumbnails:', value);
		this._imageThumbnails = value;
		this._saveBrandData();
	}

	/** brand logo
	 * _logoURI$$$ will react to local brand store
	 * logoThumbnail is the object to edit to edit the logo
	 */
	private _logoURI$$$ = new Bss$$<string | undefined>(undefined);
	private _logoThumbnail: ObjectThumbnail<EntityFile> | undefined = undefined;
	public get logoThumbnail() {
		return this._logoThumbnail;
	}
	public set logoThumbnail(value) {
		if (isEqual(value, this._logoThumbnail)) return;
		this._logoThumbnail = value;
		this._saveBrandData();
	}

	/** List of fonts to pass to fonts picker */
	fonts: string[] = [];
	/** List of color to pass to colors picker */
	colors: string[] = [];
	/** List of AudioPacks to pass to audio pack list */
	audioPacks: AudioPack[] = [];

	public get brandId() {
		return this.brand$$$.id;
	}
	@Input()
	public set brandId(newObjectId) {
		this.brand$$$.id = newObjectId;
	}

	@Input() canYouEdit = true;

	constructor(
		_cdr: ChangeDetectorRef, // for layout & cancheck
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,

		private _brandsRepository: BrandsRepository, // to get / post / update brand
		private _notificationsService: NotificationsService,
		private _fileUploadService: FileUploadService,
		private _usersRepository: UsersRepository,
		public filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);
		// read param from route
		getRouteParam$(this._activatedRoute, 'id')
			.pipe(
				untilDestroyed(this),
				tap((objectId) => {
					this.brand$$$.id = objectId;
				})
			)
			.subscribe();

		// updates component from object
		this.brand$$$.$.pipe(
			untilDestroyed(this),
			tap((brand) => {
				this._fillComponentFromObject(brand);
			})
		).subscribe();

		// convert imageURIs containing rs:// to ObjectThumbnails
		this._imageURIs$$$.$.pipe(
			untilDestroyed(this),
			switchMap((imageURLs) =>
				// imageURLS should be rs:// strings.
				combineLatest(imageURLs.map((imageUrl) => filesRepository.convertRSurlToEntityFile$(imageUrl)))
			),
			tap((entityFiles: (EntityFile | undefined)[]) => {
				this._imageThumbnails = entityFiles
					.filter((entityFile): entityFile is EntityFile => !!entityFile)
					.map((entityFile) => ({
						imageUrl: convertEntityFileToUrl(entityFile),
						object: entityFile,
					}));
			}),
			tap(() => this._check())
		).subscribe();

		// convert logoURI containing rs:// to ObjectThumbnail
		this._logoURI$$$.$.pipe(
			untilDestroyed(this),
			switchMap((imageUri) => {
				if (imageUri?.startsWith('rs://'))
					// imageURL should be a rs:// string.
					return filesRepository.convertRSurlToEntityFile$(imageUri).pipe(
						map((entityFile) => ({
							imageUrl: convertEntityFileToUrl(entityFile),
							object: entityFile,
						}))
					);
				return of({
					imageUrl: imageUri,
				});
			}),
			tap((thumbnail: ObjectThumbnail<EntityFile>) => {
				this._logoThumbnail = thumbnail;
			}),
			tap(() => this._check())
		).subscribe();
	}

	private _fillComponentFromObject(brand?: Partial<Brand>) {
		const colors = convertBrandToBrandColors(brand);
		const brandData: BrandData = brand?.data ? JSON.parse(brand.data) : {};

		if (brandData.fonts && brandData.fonts.length > 0) {
			this.fonts = brandData.fonts;
		}
		if (brandData.audioPacks && brandData.audioPacks.length > 0) {
			this.audioPacks = brandData.audioPacks;
		}
		if (colors && colors.length > 0) {
			this.colors = colors;
		}
		if (brandData.images && brandData.images.length > 0) {
			// update imageURIs which will convert to ObjectThumbnails
			this._imageURIs$$$.value = brandData.images;
		}

		if (brand?.logo) {
			this._logoURI$$$.value = brand.logo;
		}

		this._check();
	}

	/**
	 * Open the brand repository editor for brand update
	 */
	public openPromptEditor() {
		this._brandsRepository
			.openPromptEditor({
				brandId: this.brand$$$.id,
				brand: this.brand$$$.value,
				canEditSharedGroups: true,
			})
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						this._fillComponentFromObject(result);
					}
				})
			)
			.subscribe();
	}

	processOpenAudioPackPromptEvent(audioPack?: AudioPack) {
		this._brandsRepository
			.openAudioPackPromptEditor({ audioPack, brand: this.brand$$$.value })
			.pipe(
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}

	processOpenAudioPackItemPromptEvent(data: { audioPack?: AudioPack; audioPackItem?: AudioPackItem }) {
		this._brandsRepository
			.openAudioPackItemPromptEditor({
				audioPack: data.audioPack,
				audioPackItem: data.audioPackItem,
				brand: this.brand$$$.value,
			})
			.pipe(
				tap(() => {
					this._check();
				})
			)
			.subscribe();
	}

	/**
	 * Saves component data to brand repository
	 * @param result optional result from the prompt editor
	 */
	private _saveBrandData() {
		if (this.brand$$$.id) {
			// gets data from brand.data, parses it for images, fonts, & images
			const defaultBrandData: BrandData = {};
			const brandData: BrandData = this.brand$$$.value?.data ? JSON.parse(this.brand$$$.value.data) : defaultBrandData;
			brandData.images = this.imageThumbnails
				.map((imageThumbnail) => {
					if (imageThumbnail.object?.id) return 'rs://' + imageThumbnail.object?.id;
					return imageThumbnail.imageUrl;
				})
				.filter((imageUri): imageUri is string => !!imageUri);
			brandData.images = uniq(brandData.images);
			brandData.fonts = this.fonts;
			brandData.audioPacks = this.audioPacks;
			const newBrandDataAsStr = JSON.stringify(brandData);

			const updatedBrand: Partial<Brand> = {
				colors: convertColorListToBrandColors(this.colors),
				logo: this.logoThumbnail?.object?.id ? 'rs://' + this.logoThumbnail.object.id : this.logoThumbnail?.imageUrl,
				data: newBrandDataAsStr,
			};

			this._brandsRepository.updateBrand(this.brand$$$.id, updatedBrand);
		}
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     FONTS                          //
	//                                                    //
	// ---------------------------------------------------//

	public addNewFont(font: string) {
		if (!this.brand$$$.id) return;
		this.fonts.push(font);
		this._saveBrandData();
	}

	public deleteFont(fontIndex: number) {
		if (!this.brand$$$.id) return;
		this.fonts.splice(fontIndex, 1);
		this._saveBrandData();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     COLORS                         //
	//                                                    //
	// ---------------------------------------------------//

	public processColorsEvent(colors: string[]) {
		if (!this.brand$$$.id) return;
		this.colors = uniq([...this.colors, ...colors]);
		this._saveBrandData();
	}

	// deletes a color locally from given index number then saves in local brand
	public deleteColor(index: number) {
		if (!this.brand$$$.id) return;
		this.colors.splice(index, 1);
		this._saveBrandData();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     IMAGES                         //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Removes the logo from the brand
	 */
	public deleteLogo() {
		if (!this.brand$$$.id) return;
		this.logoThumbnail = undefined;
		this._saveBrandData();
	}

	setImageAsLogoByIndex(index: number) {
		if (!this.brand$$$.id) return;
		const currentImageURI = this._imageURIs$$$.value[index];
		this._brandsRepository.updateBrand(this.brand$$$.id, {
			logo: currentImageURI,
		});
	}

	public getNewImages$ = this._fileUploadService.getNewImages$;

	// ---------------------------------------------------//
	//                                                    //
	//                     AUDIOPACKS                     //
	//                                                    //
	// ---------------------------------------------------//

	public addNewAudioPack(audioPack: AudioPack) {
		if (!this.brand$$$.id) return;
		const index = this.audioPacks.findIndex((audioPack) => audioPack.name === audioPack.name);
		if (this.audioPacks.indexOf(audioPack) > -1) {
			this.audioPacks[index] = audioPack;
		} else {
			this.audioPacks.push(audioPack);
		}
		this._saveBrandData();
	}

	public deleteAudioPack(audioPackIndex: number) {
		this._notificationsService
			.confirm('Are you sure to delete this audio pack?')
			.pipe(untilDestroyed(this))
			.subscribe((confirmation) => {
				if (confirmation) {
					if (!this.brand$$$.id) return;
					// this logic is needed to change the reference of audioPacks
					const tempAudioPacks = this.audioPacks.filter((_audioPack, index) => index !== audioPackIndex);
					this.audioPacks = [...tempAudioPacks];
					this._saveBrandData();
				}
			});
	}

	public deleteAudioPackItem(data: { audioPackItem: AudioPackItem; audioPack: AudioPack }) {
		this._notificationsService
			.confirm('Are you sure to delete this audio pack item?')
			.pipe(untilDestroyed(this))
			.subscribe((confirmation) => {
				if (confirmation) {
					if (!this.brand$$$.id) return;
					const existingAudioPackIndex = this.audioPacks.findIndex((audioPack) => audioPack.id === data.audioPack.id);
					if (existingAudioPackIndex < 0) return;

					const existingAudioPackItemIndex = this.audioPacks[existingAudioPackIndex].audioPackItems.findIndex(
						(audioPackItem) => audioPackItem.id === data.audioPackItem.id
					);
					if (existingAudioPackItemIndex > -1) {
						const tempAudioPackItems = this.audioPacks[existingAudioPackIndex].audioPackItems.filter(
							(_audioPackItem, index) => index !== existingAudioPackItemIndex
						);
						this.audioPacks[existingAudioPackIndex].audioPackItems = [...tempAudioPackItems];
						this._saveBrandData();
					}
				}
			});
	}

	public updateAudioPack(audiopack: AudioPack) {
		if (!this.brand$$$.id) return;
		const index = this.audioPacks.findIndex((audioPack) => audioPack.name === audiopack.name);
		this.audioPacks[index] = audiopack;
		this._saveBrandData();
	}
}
