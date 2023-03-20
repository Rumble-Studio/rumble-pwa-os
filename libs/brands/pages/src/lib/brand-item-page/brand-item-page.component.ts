import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Brand, BrandsRepository } from '@rumble-pwa/brands/state';
import { BrandItemComponent } from '@rumble-pwa/brands/ui';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
	useObsUntilDestroyed,
} from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-brand-item-page',
	templateUrl: './brand-item-page.component.html',
	styleUrls: ['./brand-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		//
		BrandItemComponent,
		MatIconModule,
		CommonModule,
		RouterModule,
		MatDividerModule,
		MatButtonModule,
		MatMenuModule,
		TrackClickDirective,
	],
	standalone: true,
})
export class BrandItemPageComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	/**
	 * Brand to display
	 * The brand object itself is used for the brand segment even if only the id is given to the brand-item component
	 */
	public brand$$$ = new DataObsViaId<Brand>((brandId: string) => this._brandsRepository.get$(brandId));
	public canYouEdit = true;
	brands: Brand[] = [];
	profile: User | null = null;

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;
	@ViewChild(BrandItemComponent) brandItem?: BrandItemComponent;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _layoutRepository: LayoutRepository,
		private _brandsRepository: BrandsRepository,
		private _usersRepository: UsersRepository,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		useObsUntilDestroyed(this._usersRepository.connectedUser$$, (p) => (this.profile = p), this);
		// read param from route
		getRouteParam$(this._activatedRoute, 'id')
			.pipe(
				untilDestroyed(this),
				tap((objectId) => {
					this.brand$$$.id = objectId;
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});

		combineLatest([
			this._brandsRepository.ownedBrands$,
			this._brandsRepository.sharedBrands$,
			this._usersRepository.connectedUser$$,
		])
			.pipe(
				untilDestroyed(this),
				tap(([ownedBrands, sharedBrands, profile]) => {
					const sharedBrandsFiltered = sharedBrands.filter((sharedBrand) => sharedBrand.ownerId !== profile?.id);

					this.brands = sortBy(
						[...ownedBrands, ...sharedBrandsFiltered].filter(
							(brand) => brand.state !== 'archived' && brand.state !== 'deleted'
						),
						['timeUpdate']
					).reverse();

					this._check();
				})
			)
			.subscribe();

		combineLatest([this.brand$$$.$, this._usersRepository.connectedUser$$, this._brandsRepository.sharedBrands$])
			.pipe(
				untilDestroyed(this),
				tap(([brand, profile, sharedBrands]) => {
					if (brand) {
						this.canYouEdit = brand.ownerId === profile?.id || sharedBrands.some((brand) => brand.id === brand.id);
						this._layoutRepository.setLayoutProps({
							...LAYOUT_FOR_ITEM,
							displayBurgerMenu: 'auto',
							displaySidebarLeft: 'auto',
							pageSegments: [
								HOME_SEGMENT,
								{
									title: 'Branding kits ',
									link: '/brands',
								},
								{
									title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
									eventName: 'display-other-brands-menu',
								},
								{
									title: brand.name + ' ' + '<span class="material-icons-outlined"> edit </span>',
									eventName: 'open-brand-editor',
									tooltip: 'Edit brand properties',
								},
							],
						});
					}
					this._check();
				})
			)
			.subscribe();

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					const brandId = this.brand$$$.id;
					if (event === 'open-brand-editor' && brandId) {
						this.brandItem?.openPromptEditor();
					} else if (event === 'display-other-brands-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	selectBrand(brandId: string) {
		this._router.navigate(['/dashboard', 'brands', brandId]);
	}
}
