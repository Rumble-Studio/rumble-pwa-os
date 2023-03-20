import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { AVAILABLE_FONTS, convertFontLabelToFontValue } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FontsPromptComponent } from '../fonts-prompt/fonts-prompt.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-fonts-picker',
	templateUrl: './fonts-picker.component.html',
	styleUrls: ['./fonts-picker.component.scss'],
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [CommonModule, MatIconModule, MatButtonModule, TrackClickDirective],
})
export class FontsPickerComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	private _fonts: string[] = [];

	@Input()
	set fonts(value: string[]) {
		this._fonts = value;
	}
	get fonts() {
		return this._fonts;
	}

	@Output()
	newFont = new EventEmitter<string>();

	@Output()
	deleteFontEvent = new EventEmitter<number>();

	fontSlots = 10;
	editMode = false;

	@Input() canYouEdit?: boolean;

	constructor(
		_cdr: ChangeDetectorRef, // for layout
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _dialog: MatDialog,
		private _notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	getFontStyle = convertFontLabelToFontValue;

	swicthEditMode() {
		this.editMode = !this.editMode;
		this._check();
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
				if (font) {
					if (this.fonts.indexOf(font) === -1) {
						this.newFont.emit(font);
					} else {
						this._notificationsService.info('This font is already in your branding kit');
					}
				}
			});
	}

	// Emits the url if its not already in the target's list

	deleteFont(fontIndex: number) {
		this._notificationsService.confirm('Remove font?', undefined, 'Cancel', 'Yes').subscribe((confirmed) => {
			if (confirmed) {
				this.deleteFontEvent.emit(fontIndex);
			}
		});
	}
}
