/* eslint-disable @typescript-eslint/member-ordering */
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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { translate, TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { convertEntityFileToUrl, EntityFile, MacroFileKindDefined } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { scopeLoader } from '@rumble-pwa/i18n';
import { AmplitudeService, TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { VirtualPlayerService } from '@rumble-pwa/player/services';
import { RecorderService } from '@rumble-pwa/record/services';
import {
	DEFAULT_RECORDING_PROPS,
	MediaModeOptions,
	RecordingModeOptions,
	RecordingProps,
	RecordingRepository,
} from '@rumble-pwa/record/state';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck, UtilsModule } from '@rumble-pwa/utils';
import { mean } from 'lodash';
import { of } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-record-actions',
	templateUrl: './record-actions.component.html',
	styleUrls: ['./record-actions.component.scss'],
	standalone: true,
	imports: [
		//
		CommonModule,
		MatMenuModule,
		MatIconModule,
		MatButtonModule,
		UtilsModule,
		TrackClickDirective,
		TranslocoModule,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: TRANSLOCO_SCOPE,
			useValue: {
				// this 2 lines are basically
				// saying "please load the json file into ABC namespace."
				// HTML will need to use at least "profileLayout." to use its content.
				scope: 'recordUi',
				loader: scopeLoader((lang: string) => {
					return import(`../i18n/${lang}.json`);
				}),
			},
		},
	],
})
export class RecordActionsComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	RecordingModeOptions = RecordingModeOptions;
	MediaModeOptions = MediaModeOptions;

	/** At the component level (and not in the repository because we can have multiple recorder on the same page)*/
	@Input()
	previewMode = false;

	@Input() displayVideoBtn = true;
	@Input() displayAudiodBtn = true;
	@Input() displayUploadBtn = true;
	@Input() displayScreenCaptureWithVideoBtn = false;

	/** Current state of the recording repository */
	recordingProps: RecordingProps = DEFAULT_RECORDING_PROPS;

	mediaMode: MediaModeOptions | null = null;

	/** To keep track of who is recording, in case of multiple recorder available */
	@Input() recordingTargetName?: string;
	@ViewChild('videoPreview') videoPreview?: ElementRef<HTMLVideoElement>;
	@ViewChild('audioMeter') audioMeter?: ElementRef<HTMLCanvasElement>;

	counter = 0;
	timeLeft = 3;
	counting = false;
	counterInterval?: any;

	@Input() fontColor = 'black';
	@Input() borderColor = 'black';
	@Input() backgroundColor = '#00000010';
	//
	//
	//
	//
	//
	//
	//

	@Input() hasActiveTracks?: boolean;

	@Output() entityFileEvent = new EventEmitter<EntityFile | undefined>();
	@Output() clearAudioClickEvent = new EventEmitter();

	@Input() publicNameOfRecordingFile?: string;

	/**
	 * By default equals to 0 because a recording should start immediatly
	 */
	@Input() timerDuration = 3;

	@Input() override layoutSize = 0;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private recorderService: RecorderService,
		private notificationsService: NotificationsService,
		private _filesRepository: FilesRepository,
		private _amplitudeService: AmplitudeService,
		private _recordingRepository: RecordingRepository,
		private _fileUploadService: FileUploadService,
		private _usersRepository: UsersRepository,
		private _virtualPlayerService: VirtualPlayerService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// subscribe to the recording props from recording repository
		this._recordingRepository.recordingProps$
			.pipe(
				untilDestroyed(this),
				tap((props) => {
					this.recordingProps = props;
					// console.log('Recording props updated', this.recordingProps);
					if (props.recordingState == 'recording') {
						this.counting = false;
					}
					this._check();
				})
			)
			.subscribe();
	}

	/**
	 * Allow to switch between audio or video recording
	 * @param mediaMode
	 */
	public async setMediaMode(mediaMode: MediaModeOptions | null) {
		if (this.previewMode) {
			this.notificationsService.warning("You can't record an answer in preview mode", 'Preview mode');
			return;
		}

		this.mediaMode = mediaMode;
		this._recordingRepository.setRecordingProps({
			mediaMode,
		});

		console.log('[RecordActions](setMediaMode)');

		if (this.isEverythingGranted()) {
			await this.launchDevices();
		}
	}

	/**
	 * Launch browser granting procedure for video devices
	 */
	public async requestCameraAccess() {
		await this.recorderService.listVideoDevices({ removeMicBrowser: true, canAskForPermission: true, includeAudio: false });
		if (this.isEverythingGranted()) {
			this.launchDevices();
		}
	}

	/**
	 * Launch browser granting procedure for audio devices
	 */
	public async requestMicrophoneAccess() {
		await this.recorderService.listAudioDevices({ removeMicBrowser: true, canAskForPermission: true });
		if (this.isEverythingGranted()) {
			this.launchDevices();
		}
	}

	public isEverythingGranted() {
		if (this.recordingProps.mediaMode === MediaModeOptions.video)
			return this.recordingProps.cameraAccessGranted && this.recordingProps.microphoneAccessGranted;
		if (this.recordingProps.mediaMode === MediaModeOptions.screenCaptureAndVideo)
			return this.recordingProps.cameraAccessGranted && this.recordingProps.microphoneAccessGranted;
		if (this.recordingProps.mediaMode === MediaModeOptions.screenCapture) this.recordingProps.microphoneAccessGranted;
		if (this.recordingProps.mediaMode === MediaModeOptions.audio) return this.recordingProps.microphoneAccessGranted;

		return false;
	}

	private _audioContex?: AudioContext;
	public get audioContex() {
		if (!this._audioContex) {
			this._audioContex = new AudioContext();
		}
		return this._audioContex;
	}
	public set audioContex(value) {
		this._audioContex = value;
	}
	private _analyserNode?: AnalyserNode;
	public get analyserNode() {
		if (!this._analyserNode) {
			this._analyserNode = this.audioContex.createAnalyser();

			this._analyserNode.smoothingTimeConstant = 0.8;
			this._analyserNode.fftSize = 1024;
		}
		return this._analyserNode;
	}
	public set analyserNode(value) {
		this._analyserNode = value;
	}
	audioSourceNode?: MediaStreamAudioSourceNode;

	public async launchDevices() {
		console.log('[RecordActions](launchDevice)');

		this._virtualPlayerService.pauseAllPlaylists();
		await this.recorderService.launchDevices((stream: MediaStream) => {
			if (this.videoPreview) {
				// we directly use the result of the recorder as the display input
				this.videoPreview.nativeElement.srcObject = stream;
				this.videoPreview.nativeElement.muted = true;
				this.videoPreview.nativeElement.play();
				this._check();
			}
			if (this.audioMeter) {
				const canvaWidth = this.audioMeter.nativeElement.width;
				const canvaHeight = this.audioMeter.nativeElement.height;

				if (this.audioSourceNode) {
					this.audioSourceNode.disconnect();
					this.audioSourceNode = undefined;
				}
				this.audioSourceNode = this.audioContex.createMediaStreamSource(stream);
				this.audioSourceNode.connect(this.analyserNode);

				const canvasContext = this.audioMeter.nativeElement.getContext('2d');
				const lastValues = Array(300);
				const rectWidth = canvaWidth / lastValues.length;

				const draw = () => {
					requestAnimationFrame(draw);
					if (!this.analyserNode) return;
					const frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
					this.analyserNode.getByteFrequencyData(frequencyData);
					const averageFrequency = mean(frequencyData);

					if (canvasContext) {
						canvasContext.clearRect(0, 0, canvaWidth, canvaHeight);
						canvasContext.fillStyle = '#ea5a5a88';
						lastValues.splice(0, 1);
						lastValues.push(Math.min(canvaHeight, Math.max((averageFrequency / 100) * canvaHeight, 1)));
						for (let index = 0; index < lastValues.length; index++) {
							const value = lastValues[index];
							canvasContext.fillRect(index * rectWidth, (canvaHeight - value) / 2, rectWidth, value);
						}
					}
				};

				draw();
			}
		}, this.cancelCurrentRecording.bind(this));
	}

	public async askForAudioPermissions() {
		this._virtualPlayerService.pauseAllPlaylists();
		this._amplitudeService.saveEvent('playlist-recorder:ask-for-permissions-btn-clicked');
		await this.recorderService.listAudioDevices(
			{ removeMicBrowser: true, canAskForPermission: true },
			this.cancelCurrentRecording.bind(this)
		);
		this._check();
	}

	public updateAudioDevice(audioDeviceValue: MediaDeviceInfo) {
		this._virtualPlayerService.pauseAllPlaylists();
		this._recordingRepository.setRecordingProps({
			selectedAudioDevice: audioDeviceValue,
		});
		if (this.isEverythingGranted()) {
			this.launchDevices();
		}
	}

	public async askForVideoPermissions() {
		this._virtualPlayerService.pauseAllPlaylists();
		this._amplitudeService.saveEvent('playlist-recorder:ask-for-video-permissions-btn-clicked');
		await this.recorderService.listVideoDevices(
			{ removeMicBrowser: true, canAskForPermission: true, includeAudio: false },
			this.cancelCurrentRecording.bind(this)
		);
		this._check();
	}

	public async updateVideoDevice(videoDeviceValue: MediaDeviceInfo) {
		this._virtualPlayerService.pauseAllPlaylists();
		this._recordingRepository.setRecordingProps({
			selectedVideoDevice: videoDeviceValue,
		});
		if (this.isEverythingGranted()) {
			await this.launchDevices();
		}
	}

	public cancelCurrentRecording() {
		this.recorderService.cancelRecording();
		this._cancelRecordCounter();
		this.mediaMode = null;
	}

	/**
	 * called by the record button
	 * @returns
	 */
	public toggleRecordCounter() {
		this._virtualPlayerService.pauseAllPlaylists();
		if (this.counting) {
			this._cancelRecordCounter();
			return;
		}

		this.counter = 0;
		this.counting = true;
		const recordingTargetName = this.recordingTargetName;
		if (!recordingTargetName) return;
		this.counterInterval = setInterval(() => {
			this.counter++;
			this.timeLeft = Math.ceil((30 - this.counter) / 10);
			this._check();
			if (this.counter >= 30) {
				this.recorderService.startRecording(recordingTargetName, this.cancelCurrentRecording.bind(this));
				this._cancelRecordCounter();
			}
		}, 100);
	}

	private _cancelRecordCounter() {
		console.log('this.cancelCurrentRecording.bind(this)');

		clearInterval(this.counterInterval);
		this.counter = 0;
		this.counting = false;
		this.timeLeft = 3;
	}

	public stopRecording() {
		this.mediaMode = null;

		this.recorderService.stopRecording(async (file, recordingTargetName) => {
			console.log('stopRecording', file, recordingTargetName);

			// the returned recordingTargetName should match the one we are recording
			if (recordingTargetName !== this.recordingTargetName) {
				this.notificationsService.error('An error ocurred while recording. (code E.RAC001)', 'Recording');
				console.error('Recording target name mismatch.');
				return;
			}

			const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
			if (!ownerId) {
				this.notificationsService.error('An error ocurred while recording. (code E.RAC003)', 'Recording');
				console.error('No owner id found.');
				return;
			}
			try {
				this._fileUploadService
					.pleaseUploadThisFile$(
						file,
						ownerId,
						this.recordingTargetName ?? 'recording - ' + new Date().toLocaleString(),
						this.publicNameOfRecordingFile ?? 'recording - ' + new Date().toLocaleString(),
						this.recordingProps.mediaMode == MediaModeOptions.audio ? 'audio' : 'video'
					)
					.$.pipe(
						switchMap((uploadableFile) =>
							uploadableFile.entityFile?.id
								? this._filesRepository.get$(uploadableFile.entityFile?.id, false)
								: of(undefined)
						),
						filter((entityFile): entityFile is EntityFile => !!entityFile),
						filter((entityFile) => !!convertEntityFileToUrl(entityFile)),
						take(1),
						tap((entityFile) => {
							this.entityFileEvent.emit(entityFile);
						})
					)
					.subscribe();
			} catch (error) {
				this.notificationsService.error('An error ocurred while recording. (code E.RAC002)', 'Recording');
				console.error(error);
			}
		});
	}

	public openFileSelector() {
		this._virtualPlayerService.pauseAllPlaylists();
		if (this.previewMode) {
			this.notificationsService.warning("You can't upload a file in preview mode", 'Preview mode');
			return;
		}

		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;

		const acceptedFileKinds: string[] = [
			...(this.displayAudiodBtn ? ['audio'] : []),
			...(this.displayVideoBtn ? ['video'] : []),
		];
		if (acceptedFileKinds.length == 0) {
			acceptedFileKinds.push('audio');
			acceptedFileKinds.push('video');
		}

		this._filesRepository.accessibleEntityFiles$
			.pipe(
				take(1),
				switchMap((accessibleEntityFiles) => {
					const eligibleFiles: EntityFile[] = accessibleEntityFiles.filter(
						(entityFile) => acceptedFileKinds.indexOf(entityFile.kind ?? '') > -1
					);
					return this._fileUploadService.askUserForEntityFiles$(
						ownerId,
						acceptedFileKinds as MacroFileKindDefined[],
						1,
						translate('recordUi.recordActions.Upload a file'),
						undefined,
						[],
						true, // withURls
						eligibleFiles
					);
				}),

				// this._fileUploadService
				// 	.getNewAudios$(1)
				// 	.pipe(
				untilDestroyed(this),
				tap((r) => {
					if (r && r.length > 0) {
						const audioEntityFile = r[0];
						if (audioEntityFile) {
							this.entityFileEvent.emit(audioEntityFile);
							// this._usersRepository.addDataToConnectedUser({
							// 	profilePictureUrl: 'rs://' + audioEntityFile.id,
							// });
						}
					}
				})
			)
			.subscribe();
	}
}
