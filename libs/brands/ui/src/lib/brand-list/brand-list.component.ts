/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { Brand, BrandsRepository } from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { ObjectColumnComponent, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { useObsUntilDestroyed, VisionService } from '@rumble-pwa/utils';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-brand-list',
	templateUrl: './brand-list.component.html',
	styleUrls: ['./brand-list.component.scss'],
	standalone: true,
	imports: [
		ObjectListComponent,
		ObjectColumnComponent,
		MatMenuModule,
		MatIconModule,
		MatButtonModule,
		MatCardModule,
		MatSlideToggleModule,
		CommonModule,
		FormsModule,
		MatTooltipModule,
		TrackClickDirective,
	],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandListComponent extends LayoutSizeAndCheck implements CanCheck, CanBeDebugged, HasLayoutSize {
	@Input() brands: Brand[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	@Output() tableClickEventEmitter = new EventEmitter<TableClickEvent<any>>();

	@Input()
	displayArchivedToggle = true;

	private _displayArchivedBrands = false;
	public get displayArchivedBrands() {
		return this._displayArchivedBrands;
	}
	@Input()
	public set displayArchivedBrands(value) {
		this._displayArchivedBrands = value;
		this.displayArchivedBrandsChange.emit(value);
	}
	@Output()
	displayArchivedBrandsChange = new EventEmitter<boolean>();

	profile: User | null = null;
	// public get profile(): User | null {
	// 	return this._profile;
	// }
	// public set profile(value: User | null) {
	// 	console.log('%cProfile in brand list:', 'color:pink', value);

	// 	this._profile = value;
	// }

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _brandsRepository: BrandsRepository,
		private _notificationsService: NotificationsService,
		public visionService: VisionService,
		private _usersRepository: UsersRepository,
		public filesRepository: FilesRepository // for `rs://` handling
	) {
		super(_cdr, _layoutService, _activatedRoute);
		useObsUntilDestroyed(this._usersRepository.connectedUser$$, (p) => (this.profile = p), this);
		this._brandsRepository.fetchFromServer();
	}

	public deleteBrand(brand: Brand) {
		this._notificationsService.confirm().subscribe((result) => {
			if (result) {
				this._brandsRepository.updateBrand(brand.id, { state: 'deleted' });
				this._check();
			}
		});
	}

	public archiveBrand(brand: Brand) {
		this._notificationsService.confirm().subscribe((result) => {
			if (result) {
				this._brandsRepository.updateBrand(brand.id, { state: 'archived' });
				this._check();
			}
		});
	}

	public restoreBrand(brand: Brand) {
		this._brandsRepository.updateBrand(brand.id, { state: 'default' });
		this._notificationsService.success('Your brand has been restored.');
		this._check();
	}

	convertBrandToColorList(brand: Brand) {
		const prefix = 'border-radius:10px; height:20px; width:60px;background: linear-gradient(to right,';
		const suffix = ')';

		// if no color then gradient from white to white
		if (!brand.colors) return prefix + '#fff,#fff' + suffix;

		// if only one color then gradient from itself to itself
		const colorList = brand.colors.split(';');
		if (colorList.length === 1) {
			return prefix + colorList[0] + ',' + colorList[0] + suffix;
		}

		// else gradient of colors
		return prefix + brand.colors.replace(/;/g, ',') + suffix;
	}

	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		this.tableClickEventEmitter.emit(tableClickEvent);
	}
}
