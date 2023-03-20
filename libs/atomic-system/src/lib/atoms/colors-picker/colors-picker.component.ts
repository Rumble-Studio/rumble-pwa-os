import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { ColorPickerModule, ColorPickerService } from 'ngx-color-picker';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-colors-picker',
	templateUrl: './colors-picker.component.html',
	styleUrls: ['./colors-picker.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	providers: [
		ColorPickerModule,
		{
			provide: ColorPickerService,
		},
	],
	imports: [MatIconModule, CommonModule, MatButtonModule, ColorPickerModule],
})
export class ColorsPickerComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	_colors: string[] = [];
	colorPickerColor = '#c2c2c2';

	@Input()
	set colors(value: string[]) {
		this._colors = value;
	}
	get colors() {
		return this._colors;
	}

	@Output()
	newColorSelectedEvent = new EventEmitter<string>();

	@Output()
	deleteColorByIndexEvent = new EventEmitter<number>();

	newColors: string[] = [];
	editMode = false;

	@Input() canYouEdit?: boolean;

	constructor(
		_cdr: ChangeDetectorRef, // for layout
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	emitNewSelectedColor(color: string) {
		this.newColorSelectedEvent.emit(color);
	}

	emitDeleteColorByIndex(colorIndex: number) {
		this.deleteColorByIndexEvent.emit(colorIndex);
	}
}
