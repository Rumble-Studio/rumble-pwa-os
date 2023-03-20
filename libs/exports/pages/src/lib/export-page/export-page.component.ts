import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityExport } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { ExportItemComponent } from '@rumble-pwa/exports/ui';
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
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-page',
	standalone: true,
	imports: [
		//
		CommonModule,
		ExportItemComponent,
		MatMenuModule,
		TrackClickDirective,
	],
	templateUrl: './export-page.component.html',
	styleUrls: ['./export-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPageComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	public export$$$ = new DataObsViaId<EntityExport>((exportId: string) => this._exportsRepository.get$(exportId));
	exports: EntityExport[] = [];

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _exportsRepository: ExportsRepository,
		private _layoutRepository: LayoutRepository,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);
		// read param from route
		getRouteParam$(this._activatedRoute, 'id')
			.pipe(
				untilDestroyed(this),
				tap((objectId) => {
					this.export$$$.id = objectId;
				})
			)
			.subscribe();

		this._exportsRepository.entityExports$
			.pipe(
				untilDestroyed(this),
				tap((exports) => (this.exports = exports))
			)
			.subscribe();
		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.export$$$.$.pipe(
			untilDestroyed(this),
			tap((entityExport) => {
				if (entityExport) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						displayBurgerMenu: 'auto',
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Exports',
								link: '/exports',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-exports-menu',
							},
							{
								title: entityExport.name ?? 'Export',
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
					if (event === 'display-other-exports-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	selectExport(exportId: string) {
		this._router.navigate(['/dashboard', 'exports', exportId]);
	}
}
