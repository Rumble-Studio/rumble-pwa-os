import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Brand, BrandsRepository } from '@rumble-pwa/brands/state';
import { BrandListComponent } from '@rumble-pwa/brands/ui';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { TodoOpenComponent } from '@rumble-pwa/todo';
import { UpgradeComponent } from '@rumble-pwa/upgrade/ui';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-brands-list-page',
	templateUrl: './brand-list-page.component.html',
	styleUrls: ['./brand-list-page.component.scss'],
	standalone: true,
	imports: [
		BrandListComponent,
		CommonModule,
		RouterModule,
		MatIconModule,
		UpgradeComponent,
		TodoOpenComponent,
		MatSlideToggleModule,
		MatPaginatorModule,
		MatButtonModule,
		FormsModule,
		TrackClickDirective,
	],
})
export class BrandListPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	private displayArchivedBrands$$ = new BehaviorSubject(false);

	public get displayArchivedBrands() {
		return this.displayArchivedBrands$$.value;
	}
	public set displayArchivedBrands(value) {
		this.displayArchivedBrands$$.next(value);
	}

	brands: Brand[] = [];

	constructor(
		public dialog: MatDialog,
		private _brandsRepository: BrandsRepository,
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private _usersRepository: UsersRepository,
		private _router: Router,
		private _layoutRepository: LayoutRepository
	) {
		super(_cdr, _layoutService, _activateRoute);

		this._brandsRepository.fetchFromServer();

		this._layoutService.layoutSize$$.subscribe((value) => {
			this.layoutSize = value;
		});

		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			displaySidebarLeft: 'auto',
			displayBurgerMenu: 'auto',
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Branding kits',
					link: undefined,
				},
			],
		});

		combineLatest([
			this._brandsRepository.ownedBrands$,
			this.displayArchivedBrands$$,
			this._brandsRepository.sharedBrands$,
			this._usersRepository.connectedUser$$,
		])
			.pipe(
				untilDestroyed(this),
				tap(([ownedBrands, displayArchivedBrands, sharedBrands, profile]) => {
					const sharedBrandsFiltered = sharedBrands.filter((sharedBrand) => sharedBrand.ownerId !== profile?.id);

					this.brands = sortBy(
						[...ownedBrands, ...sharedBrandsFiltered].filter(
							(brand) =>
								(brand.state === 'archived' && displayArchivedBrands) ||
								(brand.state !== 'archived' && brand.state !== 'deleted')
						),
						['timeUpdate']
					).reverse();

					this._check();
				})
			)
			.subscribe();
	}

	// Opens a pompt, generates an ID, binds it to the user
	openPromptEditor() {
		const params = {
			modalTitle: 'Create a new branding kit',
			modalSubmitText: 'Create',
		};
		this._brandsRepository
			.openPromptEditor(params)
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result && result.id) {
						this._router.navigate(['/brands', result.id]);
					}
				})
			)
			.subscribe();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate([tableClickEvent.object.id], {
			relativeTo: this._activatedRoute,
		});
	}
}
