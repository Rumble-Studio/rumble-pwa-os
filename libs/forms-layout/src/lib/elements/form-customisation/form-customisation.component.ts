import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FontsPromptComponent, TextRequesterPromptComponent, TextRequesterPromptData } from '@rumble-pwa/atomic-system';
import { Brand, BrandData, BrandsRepository } from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { convertMacroKindsToAcceptedExtensionsString, EntityFile, MacroFileKindDefined } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import {
	AVAILABLE_FONTS,
	convertFontLabelToFontValue,
	DEFAULT_CUSTOMISATION_DETAILS,
	FormCustomisationDetails,
	FormCustomisationDetailsWithName,
	LAYOUTS,
} from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { checkContrastRatio, DataObsViaId, useObsUntilDestroyed } from '@rumble-pwa/utils';
import { isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { CUSTOMISATION_LIBRAIRY as CUSTOMISATION_LIBRARY, STOCK_IMAGES_SRC } from './customisationDataTemplate.config';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-customisation',
	templateUrl: './form-customisation.component.html',
	styleUrls: ['./form-customisation.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCustomisationComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	public DEFAULT_CUSTOMISATION_DETAILS = DEFAULT_CUSTOMISATION_DETAILS;

	pageLowContrast = false;
	buttonLowContrast = false;

	@Input()
	originalCustomisationData: FormCustomisationDetails = DEFAULT_CUSTOMISATION_DETAILS;

	/** Contains all data for form customisation */
	private _customisationData: FormCustomisationDetails = DEFAULT_CUSTOMISATION_DETAILS;
	public get customisationData(): FormCustomisationDetails {
		return this._customisationData;
	}
	@Input()
	public set customisationData(value: FormCustomisationDetails) {
		this._customisationData = value;
		this.brand$$$.id = value.brandId ?? undefined;
		this.pageLowContrast = checkContrastRatio(value.color ?? '', value.fontColor ?? '');
		this.buttonLowContrast = checkContrastRatio(value.actionBtnFontColor ?? '', value.actionBtnBackgroundColor ?? '');
	}
	/** Output to trigger to tell parent that customisation data changed (allows double binding) */
	@Output() customisationDataChange = new EventEmitter<FormCustomisationDetails>();

	/** Output to trigger to tell parent to save customisation data */
	@Output() customisationDataToSave = new EventEmitter<FormCustomisationDetails>();

	//------------//
	//   BRANDS   //
	//------------//
	brands$: Observable<Brand[]>;
	brand$$$ = new DataObsViaId<Brand>((brandId: string) => this._brandsRepository.get$(brandId));
	brandData?: BrandData;
	formCustomisationsFromBrandWithName: FormCustomisationDetailsWithName[] = [];

	public LAYOUT_TEMPLATES = LAYOUTS;
	getFontStyle = convertFontLabelToFontValue;
	AVAILABLE_FONTS = AVAILABLE_FONTS;
	CUSTOMISATION_LIBRARY = CUSTOMISATION_LIBRARY;

	public STOCK_IMAGES_SRC = STOCK_IMAGES_SRC;
	libraryImagesSrc: string[] = [];

	imagesFromBrandingKit = true;
	imagesFromLibrary = false;
	imagesFromStock = true;

	profile: User | null = null;

	@Input() canYouEdit?: boolean;

	maxBrandingKitsReached$$: BehaviorSubject<boolean>;

	_acceptedFileKinds: MacroFileKindDefined[] = ['image'];
	acceptedFileExtensionsString = convertMacroKindsToAcceptedExtensionsString(this._acceptedFileKinds);

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private _brandsRepository: BrandsRepository,
		private _dialog: MatDialog,
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		public filesRepository: FilesRepository, // for rs:// handling,
		private _fileUploadService: FileUploadService
	) {
		super(_cdr, _layoutService, _activateRoute);

		this.maxBrandingKitsReached$$ = this._brandsRepository.maxBrandingKitsReached$$;
		useObsUntilDestroyed(this._usersRepository.connectedUser$$, (p) => (this.profile = p), this);

		this.brands$ = this._brandsRepository.accessibleBrands$.pipe(
			untilDestroyed(this),
			map((accessibleBrands) => {
				return accessibleBrands.filter((brand) => brand.state === 'default');
			})
		);

		this.brand$$$.$.pipe(
			untilDestroyed(this),
			tap((brand) => {
				this.brandData = JSON.parse(brand?.data || '{}');
				if (this.brandData) {
					const formCustomisationsFromBrandData = this.brandData.formCustomisations ?? {};
					this.formCustomisationsFromBrandWithName = Object.keys(formCustomisationsFromBrandData).map(
						(formCustomisationFromBrandData) => {
							const formCustomisationFromBrandDataWithName: FormCustomisationDetailsWithName = {
								name: formCustomisationFromBrandData,
								formCustomisationDetails: formCustomisationsFromBrandData[formCustomisationFromBrandData],
							};
							return formCustomisationFromBrandDataWithName;
						}
					);
				}
				if (brand?.id) {
					this.customisationData.brandId = brand.id;
				}
			})
		).subscribe();

		// Gathering all accessibles image files
		this.filesRepository.accessibleEntityFiles$
			.pipe(
				untilDestroyed(this),
				switchMap((entityFiles) => {
					return entityFiles
						.filter((entityFile) => entityFile.kind === 'image')
						.map((entityFile) => this.filesRepository.convertEntityFileIdToUrl$(entityFile.id));
					// .map((entityFile) => entityFile.id)
				}),
				tap((entityFileUrls) => {
					entityFileUrls.forEach((entityFileUrl) => {
						if (!entityFileUrl) return;
						if (this.libraryImagesSrc.includes(entityFileUrl)) return;
						this.libraryImagesSrc.push(entityFileUrl);
					});
				})
			)
			.subscribe();
	}

	openFontModal() {
		this._dialog
			.open(FontsPromptComponent, {
				maxHeight: '90%',
				minWidth: '300px',
				maxWidth: '90%',
				data: {
					fonts: AVAILABLE_FONTS,
				},
			})
			.afterClosed()
			.subscribe((font) => {
				if (font) this.customisationData.font = font;
				this.emitCustomisationDetails();
				this._check();
			});
	}

	clearCustomImageSrc() {
		this.customisationData.imageSrc = undefined;
		this.emitCustomisationDetails();
	}

	clearcustomPlayerAvatarSrc() {
		this.customisationData.customPlayerAvatarSrc = undefined;
		this.emitCustomisationDetails();
	}

	customAvatartoggleChanged(event: MatSlideToggleChange, panel?: MatExpansionPanel) {
		const checked = event.checked;
		if (panel) panel.expanded = checked && !this.customisationData.customPlayerAvatarSrc;
		if (!checked) {
			this.customisationData.customPlayerAvatarSrc = undefined;
		}
	}

	emitCustomisationDetails() {
		this.customisationDataChange.emit(this.customisationData);
	}

	save() {
		if (this.customisationData.imageSrc === undefined) {
			this.customisationData.layout = 'NO_IMAGE';
		}
		this.customisationDataToSave.emit(this.customisationData);
	}

	reset() {
		this._notificationsService
			.confirm('Reset', 'Are you sure to reset those settings? You will lose your changes.')
			.subscribe((result) => {
				if (result) {
					this.customisationData = { ...this.originalCustomisationData };
					this.brand$$$.id = this.originalCustomisationData.brandId ?? undefined;
					this.emitCustomisationDetails();
				}
			});
	}

	hasDifference() {
		return !isEqual(this.customisationData, this.originalCustomisationData);
	}

	formatLabel(value: number) {
		return Math.round(100 * value) + '%';
	}

	openBrandEditor() {
		const params = { brandId: this.brand$$$.id, brand: this.brand$$$.value };
		this._brandsRepository
			.openPromptEditor(params)
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						const newBrand: Partial<Brand> = {
							...result,
							domain: result.domain === 'https://' ? undefined : result.domain,
						};
						this._brandsRepository.updateBrand(params.brandId, newBrand);
					}
				})
			)
			.subscribe();
	}

	public checkOpacity() {
		if (
			this.customisationData.layout === 'IMAGE_AS_BACKGROUND' &&
			this.customisationData.imageOpacity === 1 &&
			this.originalCustomisationData?.layout !== 'IMAGE_AS_BACKGROUND'
		) {
			this.customisationData.imageOpacity = 0.1;
			return;
		}

		if (this.customisationData.layout !== 'IMAGE_AS_BACKGROUND' && this.customisationData.imageOpacity === 0.1) {
			this.customisationData.imageOpacity = 1;
		}
	}

	saveCurrentFormCustomisationToBrandingKit() {
		const brandDataAsString = this.brand$$$.value?.data;
		const brandData: BrandData = JSON.parse(brandDataAsString ?? '{}');
		const currentFormCustomisation: FormCustomisationDetails = this.customisationData;

		const dialogData: TextRequesterPromptData = {
			title: 'Save your theme',
			textFieldLabel: 'Theme name',
		};

		this._dialog
			.open(TextRequesterPromptComponent, {
				maxHeight: '90%',
				minWidth: '300px',
				width: '800px',
				maxWidth: '90%',
				data: dialogData,
			})
			.afterClosed()
			.pipe(
				untilDestroyed(this),
				tap((customisationName) => {
					const brandId = this.brand$$$.id;
					if (!customisationName || !brandData || !currentFormCustomisation || !brandId) return;
					const newBrandData: BrandData = {
						...brandData,
						formCustomisations: {
							...brandData.formCustomisations,
							[customisationName]: currentFormCustomisation,
						},
					};

					const newBrandDataAsString = JSON.stringify(newBrandData);
					this._brandsRepository.updateBrand(brandId, { data: newBrandDataAsString });
				})
			)
			.subscribe();
	}

	/**
	 * Called when dropping files or filling the hidden input
	 * @param fileList
	 * @returns
	 */
	handleFileList(event: any, target: string) {
		const fileList: ArrayLike<File> = event ? (event.target.files as FileList) : [];
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;
		const preExistingFiles = Array.from(fileList);

		this.filesRepository.accessibleEntityFiles$
			.pipe(
				take(1),
				switchMap((accessibleEntityFiles) => {
					const eligibleFiles: EntityFile[] = accessibleEntityFiles.filter(
						(entityFile) => entityFile.kind === 'image'
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
					if (result && result[0]) {
						if (target === 'imageSrc') this.customisationData.imageSrc = 'rs://' + result[0].id;
						if (target === 'customPlayerAvatarSrc')
							this.customisationData.customPlayerAvatarSrc = 'rs://' + result[0].id;

						this.emitCustomisationDetails();
					}
					this._check();
				})
			)
			.subscribe();
	}
}
