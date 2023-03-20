/* eslint-disable @typescript-eslint/no-inferrable-types */

import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { MultiSeekEvent, VirtualTrackWithStreamStates } from '@rumble-pwa/player/services';
import { RestService } from '@rumble-pwa/requests';
import { GenericFavoriteComponent } from '@rumble-pwa/users/ui';
import { CanBeDebugged, CanCheck, DataObsViaId, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { map } from 'rxjs/operators';
import { VirtualDetailsComponent } from '../virtual-details/virtual-details.component';
import { VirtualSeekbarComponent } from '../virtual-seekbar/virtual-seekbar.component';
import { VirtualTranscriptComponent } from '../virtual-transcript/virtual-transcript.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-track',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualSeekbarComponent,
		VirtualTranscriptComponent,
		VirtualDetailsComponent,
		MatIconModule,
		MatTooltipModule,
		GenericFavoriteComponent,
		MatCheckboxModule,
		FormsModule,
		TrackClickDirective,
	],
	templateUrl: './virtual-track.component.html',
	styleUrls: ['./virtual-track.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualTrackComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	shiftKeyPressed = false;

	fileTags$$$ = new DataObsViaId<string[]>((id: string) =>
		this._filesRepository.get$(id).pipe(
			map((file) => file?.filetags),
			map((fileTags) => fileTags?.map((fileTag) => fileTag.value)),
			map((fileTagValues) => fileTagValues?.filter((fileTagValue): fileTagValue is string => !!fileTagValue))
		)
	);

	private _trackState: VirtualTrackWithStreamStates | null = null;
	public get trackState() {
		return this._trackState;
	}
	@Input()
	public set trackState(value) {
		this._trackState = value;
		this.fileTags$$$.id = value?.virtualTrack.source?.id;
		if (this._trackState?.virtualTrack.files?.length === 1) {
			const file = this._trackState.virtualTrack.files[0];
			if (file.fileId) this.downloadFileUrl = this._restService.apiRoot + '/files/' + file.fileId + '/download';
		}
		// console.log('%c trackState received in vt', 'color: #0000ff; font-weight: bold;', value);
		this._detechChanges();
	}

	/**
	 * By default a track is to be listened.
	 * If mode is "record" then we display a recorder.
	 * This should only happen if user is the owner of the track and the source is a playlist and the playlist is not used somewhere else.
	 */
	public trackMode: 'record' | 'listen' = 'listen';

	/**
	 * Display the generic favorite at the track level
	 */
	@Input() displayFavorite = false;
	/**
	 * Display the seekbar
	 */
	@Input() displaySeekbar = true;
	/**
	 * Display the transcript of the track
	 */
	@Input() displayTranscript = true;
	/**
	 * display the handles, cloud state, delete btn, etc...
	 */
	@Input() displayActions = false;
	@Input() displayDetails = true;
	/**
	 * DIsplay the play/pause button
	 */
	@Input() displayTrackPlayerActions = false;
	/**
	 * Allow download if the track is made of a single file
	 */
	@Input() displayDownload = false;
	/**
	 * Delete the track directly by holding the shift key
	 */
	@Input() deleteDirectlyHoldingShiftKey = false;

	@Output() seekMultiEvent: EventEmitter<MultiSeekEvent> = new EventEmitter<MultiSeekEvent>();

	@Output()
	deleteTrackEvent: EventEmitter<void> = new EventEmitter<void>();

	@Output()
	toggleActiveTrackEvent: EventEmitter<void> = new EventEmitter<void>();

	/**
	 * Display a checkbox to select or not a track, then emits the value
	 */
	@Input()
	displaySelected = false;

	@Input() formCustomisationDetails?: FormCustomisationDetails;

	@Input()
	selected: boolean = false;
	@Output()
	selectedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	/**
	 * Display edit icon
	 */
	@Input()
	displayTrackMode = false;

	@Output()
	newTextEvent = new EventEmitter<string | undefined>();

	/**
	 * Contains the URL of the file to use for downloading
	 */
	public downloadFileUrl?: string;

	constructor(
		//
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private notificationsService: NotificationsService,
		private _restService: RestService,
		private _filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activateRoute);
	}

	@HostListener('window:keydown', ['$event'])
	@HostListener('window:keyup', ['$event'])
	keyEventDown(event: KeyboardEvent) {
		this.shiftKeyPressed = event.shiftKey;
	}

	processSeekMultiEvent(multiSeekEvent: {
		indexToSeek: number;
		percentageOfSongToSeek: number;
		play: boolean;
		pause: boolean;
	}) {
		console.log('VirtualTrackComponent.processSeekMultiEvent', multiSeekEvent.play);

		if (this.trackState?.representativeState.error) {
			this.notificationsService.error('This track is not available', 'Error');
			console.warn(
				'VirtualTrackComponent.processSeekMultiEvent',
				'This track is not ready to be played yet',
				this.trackState?.representativeState
			);
			return;
		}
		if (!this.trackState?.representativeState.canplay) {
			this.notificationsService.warning('This track is not ready to be played yet', 'Not ready');

			return;
		}

		this.seekMultiEvent.emit(multiSeekEvent);
	}

	deleteTrack() {
		if (this.shiftKeyPressed && this.deleteDirectlyHoldingShiftKey) {
			this.deleteTrackEvent.emit();
			return;
		}
		this.notificationsService.confirm('Are you sure to delete this element?').subscribe((confirmation) => {
			if (confirmation) {
				this.deleteTrackEvent.emit();
			}
		});
	}

	toggleActiveTrack() {
		this.toggleActiveTrackEvent.emit();
	}

	processNewTextEvent(newText?: string) {
		this.newTextEvent.emit(newText);
		console.log('virtualtrakc.processNewTextEvent', newText);
	}

	togglePlay() {
		console.log('VirtualTrackComponent.togglePlay');
		if (this.trackState?.representativeState.error) {
			this.notificationsService.error('This track is not available', 'Error');
			return;
		}
		if (!this.trackState?.representativeState.canplay) {
			this.notificationsService.warning('This track is not ready to be played yet', 'Not ready');
			return;
		}
		const multiSeekEvent = {
			indexToSeek: this.trackState.representativeState.lastIndexBeingPlayed,
			percentageOfSongToSeek: this.trackState.representativeState.percentageOfLastElementBeingPlayed,
			play: !this.trackState.representativeState.playing,
			pause: this.trackState.representativeState.playing,
		};
		console.log('VirtualTrackComponent.togglePlay', multiSeekEvent);

		this.seekMultiEvent.emit(multiSeekEvent);
	}

	toggleTrackMode() {
		console.log('Not implemented yet');
		this.trackMode = this.trackMode === 'listen' ? 'record' : 'listen';
	}
}
