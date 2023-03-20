import { COMMA, ENTER, SEMICOLON, TAB } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AudioPack, Brand, BrandData, BrandsRepository } from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import {
	VirtualPlayerService,
	VirtualPlaylist,
	VirtualPlaylistWithStreamStates,
	VirtualTrack,
} from '@rumble-pwa/player/services';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
	useObsUntilDestroyed,
} from '@rumble-pwa/utils';
import { cloneDeep, sortBy } from 'lodash';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-brands-as-source',
	standalone: true,
	imports: [
		CommonModule,
		MatChipsModule,
		MatFormFieldModule,
		MatIconModule,
		MatAutocompleteModule,
		RouterModule,
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		VirtualPlaylistComponent,
		TrackClickDirective,
	],
	templateUrl: './brands-as-source.component.html',
	styleUrls: ['./brands-as-source.component.scss'],
})
export class BrandsAsSourceComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	// Input config
	separatorKeysCodes: number[] = [ENTER, COMMA, TAB, SEMICOLON];

	@Input() connectDropTo: string[] = [];

	// Brands config
	brands$: Observable<Brand[]>;
	brandSelectionCtrl = new FormControl();
	private _selectedBrand?: Brand;
	public get selectedBrand() {
		return this._selectedBrand;
	}

	public set selectedBrand(newSelectedBrand) {
		this._selectedBrand = newSelectedBrand;
		const defaultBrandData: BrandData = {};
		const data: BrandData = newSelectedBrand?.data ? JSON.parse(newSelectedBrand.data) : defaultBrandData;
		this.audioPacks = data.audioPacks || [];
		const lastAudioPackCreated: AudioPack = sortBy(this.audioPacks, 'timeCreation')[0];

		// Auto-fill with last created audio pack if exist
		this.audioPackSelectionCtrl.patchValue(lastAudioPackCreated);
	}

	// Audio packs config
	audioPackSelectionCtrl = new FormControl();
	audioPacks: AudioPack[] = [];
	_selectedAudioPack?: AudioPack;
	public get selectedAudioPack() {
		return this._selectedAudioPack;
	}
	public set selectedAudioPack(newAudioPack) {
		this._selectedAudioPack = newAudioPack;
	}

	profile: User | null = null;

	// VirtualPlaylist config
	state: VirtualPlaylistWithStreamStates | null = null;
	virtualPlaylistId = 'brand-as-source';

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _brandsRepository: BrandsRepository,
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _filesRepository: FilesRepository,
		private _virtualPlayerService: VirtualPlayerService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		useObsUntilDestroyed(this._usersRepository.connectedUser$$, (p) => (this.profile = p), this);

		this.brands$ = combineLatest([
			this._brandsRepository.ownedBrands$,
			this._brandsRepository.sharedBrands$,
			this._usersRepository.connectedUser$$,
		]).pipe(
			untilDestroyed(this),
			map(([ownedBrands, sharedBrands, profile]) => {
				const sharedBrandsFiltered = sharedBrands.filter((sharedBrand) => sharedBrand.ownerId !== profile?.id);
				return sortBy(
					[...ownedBrands, ...sharedBrandsFiltered].filter(
						(brand) => brand.state !== 'archived' && brand.state !== 'deleted'
					),
					['timeUpdate']
				).reverse();
			})
		);

		// Create virtual playlist if an audio pack is selected
		this.audioPackSelectionCtrl.valueChanges
			.pipe(
				switchMap((audioPackValue: AudioPack) => {
					this.selectedAudioPack = audioPackValue;

					if (!audioPackValue) return of([]);
					return combineLatest(
						audioPackValue.audioPackItems.map((audioPackItem) =>
							this._filesRepository
								.convertFileIdToVirtualTrack$(audioPackItem.fileId)
								.pipe(filter((virtualTrack): virtualTrack is VirtualTrack => !!virtualTrack))
						)
					);
				}),
				switchMap((virtualTracks) => {
					if (virtualTracks.length === 0) return of(null);
					const virtualPlaylist: VirtualPlaylist = {
						id: this.virtualPlaylistId,
						virtualTracks,
					};
					return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylist);
				}),
				untilDestroyed(this),
				map((state) => {
					this.state = cloneDeep(state);
					this._check();
				})
			)
			.subscribe();
	}

	public selectBrand(event: MatAutocompleteSelectedEvent) {
		this.selectedBrand = event.option.value;
	}
	public selectAudioPack(event: MatAutocompleteSelectedEvent) {
		this.selectedAudioPack = event.option.value;
	}

	public removeBrand() {
		this.selectedBrand = undefined;
		this.brandSelectionCtrl.setValue(null);
	}
	public removeAudioPack() {
		this.selectedAudioPack = undefined;
		this.audioPackSelectionCtrl.setValue(null);
	}

	public addBrandWithInput(): void {
		this._notificationsService.warning('Brand not found.');
	}
	public addAudioPackWithInput(): void {
		this._notificationsService.warning('Audio pack not found.');
	}

	public createANewBrand() {
		this._brandsRepository
			.openPromptEditor({ modalTitle: 'Create a new brand', modalSubmitText: 'Create' })
			.pipe(untilDestroyed(this))
			.subscribe();
	}
}
