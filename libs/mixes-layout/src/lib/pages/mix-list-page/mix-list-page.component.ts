import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { Mix } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { MixEditorPromptComponent } from '@rumble-pwa/mixes/ui';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-mix-list-page',
	templateUrl: './mix-list-page.component.html',
	styleUrls: ['./mix-list-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixListPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	private displayArchivedMixes$$ = new BehaviorSubject(false);
	public get displayArchivedMixes() {
		return this.displayArchivedMixes$$.value;
	}
	public set displayArchivedMixes(value) {
		this.displayArchivedMixes$$.next(value);
	}

	mixes: Mix[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _router: Router,
		public dialog: MatDialog, //
		private mixesManagementService: MixesManagementService,
		private _layoutRepository: LayoutRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this._layoutService.layoutSize$$.subscribe((value) => {
			this.layoutSize = value;
		});
		combineLatest([this.mixesManagementService.mixes$$, this.displayArchivedMixes$$])
			.pipe(
				untilDestroyed(this),
				tap(([mixes, displayArchivedMixes]) => {
					this.mixes = sortBy(
						[
							...mixes.filter(
								(mix) =>
									(mix.state === 'archived' && displayArchivedMixes) ||
									(mix.state !== 'archived' && mix.state !== 'deleted')
							),
						],
						'timeCreation'
					).reverse();
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Mixes',
					link: undefined,
				},
			],
		});
	}

	openDialog() {
		this.dialog.open(MixEditorPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { mix: undefined, autoPrefill: true },
		});
	}

	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate([tableClickEvent.object.id], { relativeTo: this._activatedRoute });
	}
}
