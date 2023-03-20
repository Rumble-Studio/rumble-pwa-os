import { moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { applyTransaction } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { VirtualPlayerService, VirtualPlaylistWithStreamStates, VirtualTrack } from '@rumble-pwa/player/services';
import { VirtualPlaybarComponent, VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { DEFAULT_RECORDING_PROPS, RecordingModeOptions, RecordingProps, RecordingRepository } from '@rumble-pwa/record/state';
import { Track, TracksRepository } from '@rumble-pwa/tracks/state';
import { Bs$$, DataObsViaId } from '@rumble-pwa/utils';
import { cloneDeep } from 'lodash';
import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { RecordActionsComponent } from '../record-actions/record-actions.component';
import { emitOnce } from '@ngneat/elf';

const virtualPlaylistIdPrefix = 'vpr-';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-playlist-recorder',
	standalone: true,
	imports: [
		//
		CommonModule,
		RecordActionsComponent,
		VirtualPlaylistComponent,
		VirtualPlaybarComponent,
		MatTooltipModule,
		TrackClickDirective,
	],
	templateUrl: './virtual-playlist-recorder.component.html',
	styleUrls: ['./virtual-playlist-recorder.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualPlaylistRecorderComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, OnInit
{
	public RecordingModeOptions = RecordingModeOptions;

	@Input()
	previewMode = false;

	@Input() customPlaybarColor?: string;

	recordingProps: RecordingProps = DEFAULT_RECORDING_PROPS;

	@Input()
	displayTracks = false;

	private _formCustomisationDetails?: FormCustomisationDetails;
	@Input()
	public set formCustomisationDetails(newFormCustomisationDetails) {
		this._formCustomisationDetails = newFormCustomisationDetails;
		this.customPlaybarColor = this.customPlaybarColor ?? newFormCustomisationDetails?.playbarColor;
	}

	public get formCustomisationDetails() {
		return this._formCustomisationDetails;
	}

	playlistState: VirtualPlaylistWithStreamStates | null = null;

	tracks$$$ = new DataObsViaId<Track[]>(
		this._tracksRepository.getTracks$,
		this._tracksRepository
		// 'tracks in vpr'
	);

	@Output() hasActiveTracks = new EventEmitter<boolean>();

	playlistId$$ = new Bs$$<string>();
	@Input()
	public set playlistId(newPlaylistId) {
		this.playlistId$$.value = newPlaylistId;
		this.tracks$$$.id = newPlaylistId ?? undefined;
	}
	public get playlistId() {
		return this.playlistId$$.value;
	}

	@Input() displayVideoBtn = true;
	@Input() displayAudiodBtn = true;
	@Input() displayUploadBtn = true;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _playlistsManagementService: PlaylistsManagementService,
		private _tracksRepository: TracksRepository,
		private _filesRepository: FilesRepository,
		private _virtualPlayerService: VirtualPlayerService,
		private _notificationService: NotificationsService,
		private _recordingRepository: RecordingRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	ngOnInit() {
		// Process playlistId to fill virtual player service and get playlist state
		this.playlistId$$.$$.pipe(
			untilDestroyed(this),
			switchMap((playlistId) => {
				if (!playlistId) {
					return of(null);
				}
				return this._tracksRepository.convertPlaylistIdToVirtualPlaylist$(
					playlistId,
					virtualPlaylistIdPrefix + playlistId
				);
			}),
			switchMap((virtualPlaylist) => {
				if (!virtualPlaylist) return of(null);

				// upsert virtual playlist to virtual player service
				return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylist);
			}),
			tap((playlistState) => {
				this.playlistState = cloneDeep(playlistState);
				this._detechChanges();
			})
		).subscribe();

		// subscribe to tracks (tracks are used by event listeners on virtual playlist)
		this.tracks$$$.$.pipe(
			untilDestroyed(this),
			tap((tracks) => {
				const hasActiveTracks = tracks?.some((track) => track.active);
				this.hasActiveTracks.emit(hasActiveTracks);
			})
		).subscribe();

		// listen to playlist repository to get recording mode (to display it)
		this._recordingRepository.recordingProps$
			.pipe(
				untilDestroyed(this),
				tap((recordingProps: RecordingProps) => {
					if (
						recordingProps.recordingMode === RecordingModeOptions.append &&
						this.recordingProps.recordingMode !== RecordingModeOptions.append
					) {
						this.displayTracks = true;
					}

					this.recordingProps = recordingProps;
					this._check();
				})
			)
			.subscribe();
	}

	public processDropTrackEvent(event: any) {
		console.log('processDropTrackEvent', event, this.tracks$$$.value);

		if (!this.tracks$$$.value) {
			console.log('returning as tracks$$$ has no value');

			return;
		}

		// if same container
		if (event.container.id === event.previousContainer.id) {
			const tracksCopy = cloneDeep(this.tracks$$$.value);
			moveItemInArray(tracksCopy, event.previousIndex, event.currentIndex);
			emitOnce(() => {
				tracksCopy.forEach((track, track_index) => {
					if (track.rank != track_index) {
						this._tracksRepository.updateTrack(track.id, {
							rank: track_index,
						});
					}
				});
			});
		} else {
			console.warn('[virtualPlaylistRecorder] drop track from different container not implemented');
		}
	}

	/**
	 * Set active to false for each active track
	 */
	public processClearAudioClickEvent() {
		this.playlistState?.virtualPlaylist.virtualTracks.forEach((virtualTrack) => {
			if (virtualTrack.active) this.processToggleActiveTrackEvent(virtualTrack);
		});
	}

	public processToggleActiveTrackEvent(virtualTrack: VirtualTrack) {
		if (virtualTrack.source?.kind !== 'track') return;
		const trackId = virtualTrack.source?.id;
		if (!trackId) return;
		const track: Track | undefined = this._tracksRepository.get(trackId);
		if (!track) return;
		this._tracksRepository.updateTrack(trackId, { active: !track.active });
	}

	public processDeleteTrackEvent(virtualTrack: VirtualTrack) {
		if (virtualTrack.source?.kind !== 'track') return;
		const trackId = virtualTrack.source?.id;
		if (!trackId) return;
		this._tracksRepository.updateTrack(trackId, { state: 'deleted' });
	}
	public toggleRecordingMode() {
		if (
			this.recordingProps.recordingMode === RecordingModeOptions.append &&
			(this.playlistState?.virtualPlaylist?.virtualTracks?.filter((vt) => vt.active) ?? []).length > 1
		) {
			this._notificationService.warning(
				'You have multiple tracks active. To go back to the simple mode, you need to keep at most one track active.',
				'Advanced Recording Mode',
				undefined,
				undefined,
				20000
			);

			return;
		}
		const possibleModes = [RecordingModeOptions.replace, RecordingModeOptions.append];
		const currentMode = this.recordingProps.recordingMode;
		const currentModeIndex = possibleModes.indexOf(currentMode);
		const nextModeIndex = (currentModeIndex + 1) % possibleModes.length;
		const nextMode = possibleModes[nextModeIndex] as RecordingModeOptions;
		this._recordingRepository.setRecordingProps({
			recordingMode: nextMode,
		});
	}
	public toggleDisplayTracks() {
		// console.log('toggleDisplayTracks', 'not implemented yet');
		this.displayTracks = !this.displayTracks;

		// this._recordingRepository.setRecordingProps({
		// 	displayTracks: !this.displayTracks,
		// });
	}
	public processNewTextOnTrackEvent({ virtualTrack, newText }: { virtualTrack: VirtualTrack; newText: string | undefined }) {
		console.log('processNewTextOnTrackEvent', virtualTrack, newText);

		if (virtualTrack.source?.kind !== 'track') {
			console.warn('We don\'t process new text if not a "track"');
			return;
		}
		const trackId = virtualTrack.source?.id;
		if (!trackId) {
			console.warn('Missing track id');

			return;
		}
		const track: Track | undefined = this._tracksRepository.get(trackId);
		if (!track) {
			console.warn('Missing track');

			return;
		}
		const fileId = track.fileId;
		if (!fileId) {
			console.warn('Missing file id');
			return;
		}
		this._filesRepository.addData(fileId, { transcripts: { edited_manual: newText } });
	}

	public processEntityFileEvent(entityFile: EntityFile | undefined) {
		console.log('(processEntityFileEvent)', entityFile);

		if (!this.playlistId) return;
		if (!entityFile) return;
		const fileId = entityFile.id;
		const currentTracks = this._tracksRepository.getTracks(this.playlistId);
		if (this.recordingProps.recordingMode === RecordingModeOptions.append) {
			// create new track and append it to the playlist
			this._tracksRepository.upsertTrack({
				id: uuidv4(),
				playlistId: this.playlistId,
				fileId,
				active: true,
				rank: currentTracks.length,
			});
		} else if (this.recordingProps.recordingMode === RecordingModeOptions.replace) {
			const trackId = uuidv4();

			this._tracksRepository.upsertTrack({
				id: trackId,
				playlistId: this.playlistId,
				fileId,
				active: true,
				rank: currentTracks.length,
			});

			const otherActiveTracks: Track[] = this._tracksRepository
				.getTracks(this.playlistId)
				.filter((track) => track.active && track.id != trackId);

			otherActiveTracks.forEach((track) => {
				this._tracksRepository.updateTrack(track.id, {
					active: false,
				});
			});
		} else {
			console.log('this.recordingProps.recordingMode not recognized:', this.recordingProps.recordingMode);
		}
	}
}
