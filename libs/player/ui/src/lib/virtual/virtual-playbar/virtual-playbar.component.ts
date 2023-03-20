/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { VirtualPlayerService, VirtualPlaylistWithStreamStates } from '@rumble-pwa/player/services';
import { GenericFavoriteComponent } from '@rumble-pwa/users/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck, UtilsModule } from '@rumble-pwa/utils';
import { setTimeout } from 'worker-timers';
import { VirtualDetailsComponent } from '../virtual-details/virtual-details.component';
import { VirtualSeekbarComponent } from '../virtual-seekbar/virtual-seekbar.component';
import { VirtualTranscriptComponent } from '../virtual-transcript/virtual-transcript.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-playbar',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualDetailsComponent,
		VirtualSeekbarComponent,
		UtilsModule,
		GenericFavoriteComponent,
		VirtualTranscriptComponent,
		TrackClickDirective,
		MatIconModule,
	],
	templateUrl: './virtual-playbar.component.html',
	styleUrls: ['./virtual-playbar.component.scss'],
})
export class VirtualPlaybarComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged, OnDestroy {
	private _state: VirtualPlaylistWithStreamStates | null = null;
	public get state(): VirtualPlaylistWithStreamStates | null {
		return this._state;
	}
	@Input()
	public set state(value: VirtualPlaylistWithStreamStates | null) {
		this._state = value;
		this._detechChanges();
	}

	@Input() displayFavorite = false;
	@Input() compact = false;
	@Input() displayDetails = true;
	@Input() customPictureSrc?: string;

	private _formCustomisationDetails?: FormCustomisationDetails;
	@Input()
	public set formCustomisationDetails(newFormCustomisationDetails) {
		this._formCustomisationDetails = newFormCustomisationDetails;
		this.customPictureSrc = this.customPictureSrc ?? newFormCustomisationDetails?.customPlayerAvatarSrc;
	}

	public get formCustomisationDetails() {
		return this._formCustomisationDetails;
	}

	/**
	 * Should we display the transcript
	 */
	@Input() displayTranscript: boolean = false;

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

	togglePlay() {
		const virtualPlaylistId = this.state?.virtualPlaylist?.id;
		if (virtualPlaylistId) {
			if (this.state?.representativeState.playing) this._virtualPlayerService.pausePlaylist(virtualPlaylistId, false);
			else {
				this._virtualPlayerService.resumePlaylist(virtualPlaylistId);
			}
		}
	}

	processSeekMultiEvent(multiSeekEvent: { indexToSeek: number; percentageOfSongToSeek: number; play: boolean }) {
		if (!this.state) return;
		this._virtualPlayerService.seekTrackAtPercentage(
			this.state.virtualPlaylist.id,
			multiSeekEvent.indexToSeek,
			multiSeekEvent.percentageOfSongToSeek
		);
		if (multiSeekEvent.play) {
			this._virtualPlayerService.resumePlaylist(this.state.virtualPlaylist.id);
		}
	}

	ngOnDestroy() {
		const virtualPlaylistId = this.state?.virtualPlaylist?.id;
		if (virtualPlaylistId) this._virtualPlayerService.pausePlaylist(virtualPlaylistId);
	}

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
