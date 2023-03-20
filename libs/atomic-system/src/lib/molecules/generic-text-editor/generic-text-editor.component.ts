import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';

const DEFAULT_TEXT = '';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-generic-text-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, ClipboardModule, TrackClickDirective],
	templateUrl: './generic-text-editor.component.html',
	styleUrls: ['./generic-text-editor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericTextEditorComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	@ViewChild('textarea', { static: false }) textarea?: ElementRef<HTMLTextAreaElement>;

	@Input() text?: string;
	@Input() originalText?: string;
	@Input() icon = 'format_quote';
	@Input() formCustomisationDetails?: FormCustomisationDetails;
	@Input() allowEditing = false;

	@Output() newTextEvent = new EventEmitter<string | undefined>();

	editingMode = false;

	DEFAULT_TEXT = DEFAULT_TEXT;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	launchEditingMode() {
		this.editingMode = true;
		this.text = this.text ?? this.originalText;
		this._detechChanges();
		if (this.textarea) {
			this.textarea.nativeElement.focus();
		}
	}

	saveEdits() {
		this.editingMode = false;
		this.newTextEvent.emit(this.text);
		this._detechChanges();
	}

	resetEdits() {
		this.text = this.originalText;
		this.saveEdits();
	}

	processCopyToClipboardEvent(copied: boolean) {
		if (copied) {
			this.notificationsService.success('Content copied!', undefined, undefined, undefined, 1000);
		} else {
			this.notificationsService.error('Error while copying');
		}
	}
}
