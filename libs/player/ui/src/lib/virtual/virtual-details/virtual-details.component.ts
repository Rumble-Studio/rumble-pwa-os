/* eslint-disable @typescript-eslint/no-inferrable-types */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-details',
	standalone: true,
	imports: [
		//
		CommonModule,
		MatTooltipModule,
		MatIconModule,
		TrackClickDirective,
	],
	templateUrl: './virtual-details.component.html',
	styleUrls: ['./virtual-details.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualDetailsComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	@Input() pictureSRCs: string[] = [];
	@Input() title?: string;
	@Input() description?: string;
	@Input() displayTexts = true;
	@Input() tags?: string[] | null;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		public filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activateRoute);
	}
}
