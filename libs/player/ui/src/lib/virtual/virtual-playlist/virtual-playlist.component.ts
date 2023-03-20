/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	Output,
	ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import {
	MultiSeekEvent,
	VirtualPlayerService,
	VirtualPlaylistWithStreamStates,
	VirtualTrack,
	VirtualTrackWithStreamStates,
} from '@rumble-pwa/player/services';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { v4 as uuidv4 } from 'uuid';
import { setTimeout } from 'worker-timers';
import { VirtualTrackComponent } from '../virtual-track/virtual-track.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-playlist',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualTrackComponent,
		MatIconModule,
		DragDropModule,
		TrackClickDirective,
	],
	templateUrl: './virtual-playlist.component.html',
	styleUrls: ['./virtual-playlist.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualPlaylistComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	private _state: VirtualPlaylistWithStreamStates | null = null;
	public get state() {
		return this._state;
	}
	@Input()
	public set state(value) {
		this._state = value;
		// console.log('%c playlistState received in vp', 'color: #ffffff; font-weight: bold;', value);
		this._check();
	}

	private _virtualTracksSelected: boolean[] = [];
	public get virtualTracksSelected() {
		return this._virtualTracksSelected;
	}
	public set virtualTracksSelected(value) {
		this._virtualTracksSelected = value;
		console.log('%c virtualTracksSelected received in vp', 'color: #ffffff; font-weight: bold;', value);
	}

	/**
	 * Only used for dropping
	 */
	@Input() playlistIdentifier: string = uuidv4();

	/**
	 * List of drop container we can drop on from this list
	 */
	@Input() connectDropTo: string[] = [];
	@Input() canDrag = true;
	@Input() canEdit = false;
	@Input() displayTranscript = true;
	@Input() displayUnactiveTracks = false; // true in playlist recorder for example
	@Input() displayEndOfPlaylist = false; // true in global playlist for example

	/**
	 * Display or not the delete, drag, toggle activation buttons on the right of the track
	 * True in playlist recorder for example
	 */
	@Input() displayTrackActions = false;

	/**
	 * Display the favorite section or not
	 */
	@Input() displayFavorite = false;

	/**
	 * Display the detail section (image, title, description) of the track
	 */
	@Input() displayDetails = false;

	@Input() displayDragHelp = false;

	/**
	 * Display or not the play button at the track level
	 * Generally to set to true when there is no virtual playbar (export-item for example)
	 */
	@Input() displayTrackPlayerActions = false;

	/**
	 * Allow download at the track level: should be only used on exported(paid) files
	 */
	@Input() displayDownload = false;

	/**
	 * Display select checkbox in VT
	 */
	@Input() displaySelected = false;

	/**
	 * Display or not the switch to go to record mode on track
	 */
	@Input()
	displayTrackMode = false;

	/**
	 * Delete the track directly by holding the shift key
	 */
	@Input() deleteDirectlyHoldingShiftKey = false;

	/**
	 * Displayed when no state is available
	 */
	@Input() defaultNoStateMsg = 'Nothing here yet';

	@Input() formCustomisationDetails?: FormCustomisationDetails;

	@Output() dropTrackEvent = new EventEmitter<CdkDragDrop<VirtualTrack[], VirtualTrack[], VirtualTrack>>();
	@Output() deleteTrackEvent = new EventEmitter<VirtualTrack>();
	@Output() toggleActiveTrackEvent = new EventEmitter<VirtualTrack>();
	@Output() newTextOnTrackEvent = new EventEmitter<{ virtualTrack: VirtualTrack; newText: string | undefined }>();
	@Output() clickTrackEvent = new EventEmitter<VirtualTrack>();

	private _canvasElement?: ElementRef<HTMLCanvasElement> | undefined;
	public get canvasElement(): ElementRef<HTMLCanvasElement> | undefined {
		return this._canvasElement;
	}
	@ViewChild('canvasElement')
	public set canvasElement(value: ElementRef<HTMLCanvasElement> | undefined) {
		this._canvasElement = value;
		if (this.state?.id) this._virtualPlayerService.registerVideoPreview(this.state.id, this._canvasElement?.nativeElement);
	}
	@Input() displayVideo = true;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private _virtualPlayerService: VirtualPlayerService
	) {
		super(_cdr, _layoutService, _activateRoute);
	}

	processNewTextEvent(newText: string | undefined, trackState: VirtualTrackWithStreamStates) {
		this.newTextOnTrackEvent.emit({ virtualTrack: trackState.virtualTrack, newText });
	}

	processSeekMultiEvent(multiSeekEvent: MultiSeekEvent, trackState: VirtualTrackWithStreamStates) {
		if (!this.state) return;

		console.log('%c processSeekMultiEvent', 'color: #ffffff; font-weight: bold;', multiSeekEvent, trackState, this.state);

		if (multiSeekEvent.pause) {
			this._virtualPlayerService.pausePlaylist(this.state.virtualPlaylist.id);
			return;
		}

		this._virtualPlayerService.seekTrackInVirtualPlaylist(
			this.state.virtualPlaylist.id,
			trackState.virtualTrack.id,
			multiSeekEvent.indexToSeek,
			multiSeekEvent.percentageOfSongToSeek
		);
		if (multiSeekEvent.play) {
			this._virtualPlayerService.resumePlaylist(this.state.virtualPlaylist.id, false);
		}
	}
	trackByFn(index: number, item: VirtualTrackWithStreamStates) {
		return item.virtualTrack.id;
	}

	drop(event: CdkDragDrop<VirtualTrack[], VirtualTrack[], VirtualTrack>) {
		if (!event.isPointerOverContainer) {
			return;
		}
		this.dropTrackEvent.emit(event);
	}

	processDeleteTrackEvent(trackIndex: number) {
		if (!this.state) return;

		this.deleteTrackEvent.emit(this.state.virtualPlaylist.virtualTracks[trackIndex]);
	}

	processToggleActiveTrackEvent(trackIndex: number) {
		if (!this.state) return;

		this.toggleActiveTrackEvent.emit(this.state.virtualPlaylist.virtualTracks[trackIndex]);
	}

	processClick(trackState: VirtualTrackWithStreamStates) {
		if (!this.state) return;
		this.clickTrackEvent.emit(trackState.virtualTrack);
	}

	togglePlay() {
		const virtualPlaylistId = this.state?.virtualPlaylist?.id;
		if (virtualPlaylistId) {
			if (this.state?.representativeState.playing) this._virtualPlayerService.pausePlaylist(virtualPlaylistId, false);
			else {
				this._virtualPlayerService.resumePlaylist(virtualPlaylistId);
			}
		}
	}
	// processTrackSelectedEvent(virtualTrack: VirtualTrack, selected: boolean) {
	// 	const virtualTrackIndex = this.virtualTracksSelected.indexOf(virtualTrack);

	// 	if (virtualTrackIndex > -1 && !selected) {
	// 		this.virtualTracksSelected.splice(virtualTrackIndex, 1);
	// 	}
	// 	if (virtualTrackIndex === -1 && selected) this.virtualTracksSelected.push(virtualTrack);

	// 	if (this._debug) console.log('List of virtual tracks selected: ', this.virtualTracksSelected);
	// }

	timer?: number;
	preventSimpleClick = false;
	delay = 200;
	simpleClickFunction(): void {
		this.preventSimpleClick = false;
		this.timer = setTimeout(() => {
			if (!this.preventSimpleClick) {
				//whatever you want with simple click go here
				this.togglePlay();
			}
		}, this.delay);
	}
	doubleClickFunction(fn: 'open' | 'close' = 'open'): void {
		this.preventSimpleClick = true;
		clearTimeout(this.timer);
		//whatever you want with double click go here
		if (fn === 'open') this._openFullScreen();
		else this._closeFullScreen();
	}

	private _fullScreenCanvas?: HTMLCanvasElement;
	private _overlayElement?: HTMLDivElement;
	private _openFullScreen() {
		this._overlayElement = document.createElement('div');
		this._overlayElement.setAttribute(
			'style',
			'position:fixed; top: 0; left: 0; width:100%; height:100%; background-color:#000000f0 ; z-index:100;'
		);
		this._overlayElement.addEventListener('click', () => this._closeFullScreen());
		document.body.appendChild(this._overlayElement);

		this._fullScreenCanvas = document.createElement('canvas');
		this._fullScreenCanvas.setAttribute('width', window.screen.availWidth + 'px');
		this._fullScreenCanvas.setAttribute('height', window.screen.availHeight + 'px');
		this._fullScreenCanvas.setAttribute(
			'style',
			'position:fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);z-index:100;'
		);
		this._fullScreenCanvas.addEventListener('click', () => this.simpleClickFunction());
		this._fullScreenCanvas.addEventListener('dblclick', () => this.doubleClickFunction('close'));
		document.body.appendChild(this._fullScreenCanvas);
		if (this.state?.id && this._fullScreenCanvas) {
			this._virtualPlayerService.registerVideoPreview(this.state.id, this._fullScreenCanvas);
			// document.documentElement.requestFullscreen();
		}
	}

	private _closeFullScreen() {
		// if (!document.fullscreenElement) {
		// 	document.documentElement.requestFullscreen();
		// } else if (document.exitFullscreen) {
		// document.exitFullscreen();
		if (this._fullScreenCanvas) {
			document.body.removeChild(this._fullScreenCanvas);
			if (this.state?.id) {
				this._virtualPlayerService.registerVideoPreview(this.state.id, this._canvasElement?.nativeElement);
			}
			this._fullScreenCanvas.removeEventListener('click', () => this.simpleClickFunction());
			this._fullScreenCanvas.removeEventListener('dblclick', () => this.doubleClickFunction('close'));

			this._fullScreenCanvas.remove();
			this._fullScreenCanvas = undefined;
		}
		if (this._overlayElement) {
			this._overlayElement.removeEventListener('click', () => this._closeFullScreen());
			this._overlayElement.remove();
			this._overlayElement = undefined;
		}
		// }
	}

	@HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
		if (this._overlayElement || this._fullScreenCanvas) this._closeFullScreen();
	}
}
