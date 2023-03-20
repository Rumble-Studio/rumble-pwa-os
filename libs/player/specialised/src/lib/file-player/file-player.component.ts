/* eslint-disable @typescript-eslint/no-inferrable-types */
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { VirtualPlayerService, VirtualPlaylistWithStreamStates } from '@rumble-pwa/player/services';
import { VirtualPlaybarComponent } from '@rumble-pwa/player/ui';
import { RestService } from '@rumble-pwa/requests';
import { Bs$$, DataObsViaId } from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

const virtualFilePlayerIdPrefix = 'vfp-';

type OnChangeFn = undefined | ((arg: string | null) => void);
type OnTouchFn = unknown;

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-file-player',
	standalone: true,
	imports: [
		//
		CommonModule,
		VirtualPlaybarComponent,
		DragDropModule,
		MatIconModule,
		TrackClickDirective,
	],
	templateUrl: './file-player.component.html',
	styleUrls: ['./file-player.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: FilePlayerComponent,
			multi: true,
		},
	],
})
export class FilePlayerComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	@Input()
	listeningMessage?: string;

	@Input()
	virtualPlaylistPrefix?: string;

	@Input()
	displayDetails = true;

	playlistState: VirtualPlaylistWithStreamStates | null = null;

	file$$$ = new DataObsViaId((fileId) => this._filesRepository.get$(fileId));

	fileId$$ = new Bs$$<string>();
	@Input()
	public set fileId(newFileId) {
		this.fileId$$.value = newFileId;
		if (newFileId) this.file$$$.id = newFileId;
	}
	public get fileId() {
		return this.fileId$$.value;
	}

	@Input() connectDropTo: string[] = [];

	/**
	 * Should we display the transcript
	 */
	@Input() displayTranscript: boolean = false;

	/**
	 * Allow download if the track is made of a single file
	 */
	@Input() displayDownload = false;

	/**
	 * Contains the URL of the file to use for downloading
	 */
	public downloadFileUrl?: string;

	private _onChange: OnChangeFn;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _virtualPlayerService: VirtualPlayerService,
		private _filesRepository: FilesRepository,
		private _restService: RestService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// Process fileId to fill virtual player service and get the virtual playlist state
		this.fileId$$.$$.pipe(
			untilDestroyed(this),
			map((fileId) => {
				if (!fileId) {
					return null;
				}
				return this._filesRepository.convertFileIdToVirtualPlaylist(
					fileId,
					virtualFilePlayerIdPrefix + fileId + this.virtualPlaylistPrefix
				);
			}),
			switchMap((virtualPlaylist) => {
				if (!virtualPlaylist) return of(null);

				// upsert virtual playlist to virtual player service
				return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylist);
			}),
			tap((playlistState) => {
				this.playlistState = playlistState;
				this._check();
			})
		).subscribe();

		this.file$$$.$.pipe(
			tap((file) => {
				this.downloadFileUrl = file ? this._restService.apiRoot + '/files/' + file.id + '/download' : undefined;
			})
		).subscribe();
	}

	/**
	 * Needed for ControlValueAccessor implementation: triggered by a patch value on form group
	 * @param newFilesWithData
	 */
	public writeValue(fileId: string | null) {
		this.fileId = fileId;
	}

	registerOnChange(fn: OnChangeFn) {
		this._onChange = fn;
		this._check();
	}

	registerOnTouched(fn: OnTouchFn) {
		// console.log('On touch event in files upload control', fn);
	}
}
