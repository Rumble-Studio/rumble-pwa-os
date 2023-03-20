/* eslint-disable @typescript-eslint/no-inferrable-types */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { GenericTextEditorComponent } from '@rumble-pwa/atomic-system';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { VirtualTrackComponent } from '../virtual-track/virtual-track.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-transcript',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualTrackComponent,
		GenericTextEditorComponent,
		TrackClickDirective,
	],
	templateUrl: './virtual-transcript.component.html',
	styleUrls: ['./virtual-transcript.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualTranscriptComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	@Input()
	transcriptEdited?: string;
	@Input()
	transcriptOriginal?: string;
	@Input()
	allowEditing = false;
	@Input() formCustomisationDetails?: FormCustomisationDetails;

	@Output()
	newTextEvent = new EventEmitter<string | undefined>();

	constructor(_cdr: ChangeDetectorRef, _layoutService: LayoutService, _activateRoute: ActivatedRoute) {
		super(_cdr, _layoutService, _activateRoute);
	}

	processNewTextEvent(newText?: string) {
		this.newTextEvent.emit(newText);
	}
}
