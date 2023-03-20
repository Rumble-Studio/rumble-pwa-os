// import { Buffer } from 'buffer';
import { Injectable } from '@angular/core';
import RecordRTC from 'recordrtc';
// import { WindowRefService } from '../window-ref.service';
// import hark from 'hark';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';

import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { NotificationsService } from '@rumble-pwa/client-notifications';

// import { Reader, Decoder, tools } from 'ts-ebml';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DEFAULT_RECORDING_PROPS, RecordingProps, RecordingRepository } from '@rumble-pwa/record/state';
import { fixWebmDuration, isWebview, PreventDeviceToSleep } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';
import { setTimeout } from 'worker-timers';
import { VideoStreamMerger } from './merger.service';

const MEDIARECORDER_EVENTS = [
	//
	'dataavailable',
	'error',
	'pause',
	'resume',
	'start',
	'stop',
	'warning',
];

const RECORDRTC_MIMETYPES = [
	'audio/webm',
	'audio/webm;codecs=pcm',
	'video/mp4',
	'video/webm',
	'video/webm;codecs=vp9',
	'video/webm;codecs=vp8',
	'video/webm;codecs=h264',
	'video/x-matroska;codecs=avc1',
	'video/mpeg',
	'audio/wav',
	'audio/ogg',
];

function getSupportedVideoMimeTypes() {
	const VIDEO_TYPES = ['webm', 'ogg', 'mp4', 'x-matroska'];
	const VIDEO_CODECS = ['vp9', 'vp9.0', 'vp8', 'vp8.0', 'avc1', 'av1', 'h265', 'h.265', 'h264', 'h.264', 'opus'];

	const supportedTypes: string[] = [];
	VIDEO_TYPES.forEach((videoType) => {
		const type = `video/${videoType}`;
		VIDEO_CODECS.forEach((codec) => {
			const variations = [
				`${type};codecs=${codec}`,
				`${type};codecs:${codec}`,
				`${type};codecs=${codec.toUpperCase()}`,
				`${type};codecs:${codec.toUpperCase()}`,
				`${type}`,
			];
			variations.forEach((variation) => {
				if (MediaRecorder.isTypeSupported(variation) && RECORDRTC_MIMETYPES.includes(variation))
					supportedTypes.push(variation);
			});
		});
	});

	return supportedTypes;
}

function getSupportedAudioMimeTypes(ignoreRecorderRtc: boolean = false, debug = false): string[] {
	const AUDIO_TYPES = [
		'ogg',
		'opus',
		'mp4',
		'flac',
		'webm',
		'isac',
		'wav',
		'x-wav',
		'mpeg',
		'aac',
		'aacp',
		'x-caf',
		'x-matroska',
		'invalid',
	];
	const AUDIO_CODECS = ['opus', 'vorbis', 'pcm'];

	const supportedTypes: string[] = [];
	AUDIO_TYPES.forEach((audioType) => {
		const type = `audio/${audioType}`;
		AUDIO_CODECS.forEach((codec) => {
			const variations = [
				`${type};codecs=${codec}`,
				`${type};codecs:${codec}`,
				`${type};codecs=${codec.toUpperCase()}`,
				`${type};codecs:${codec.toUpperCase()}`,
				`${type}`,
			];
			variations.forEach((variation) => {
				if (
					MediaRecorder.isTypeSupported(variation) &&
					(ignoreRecorderRtc || RECORDRTC_MIMETYPES.includes(variation))
				) {
					supportedTypes.push(variation);
				}
			});
		});
	});

	if (supportedTypes.length === 0) {
		if (debug) console.warn('No supported audio mimetype found overlapping RecorderRTC mimetypes.');
		return getSupportedAudioMimeTypes(true, debug);
	}
	return supportedTypes;
}

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class RecorderService {
	private _videoStreamMerger?: VideoStreamMerger;
	public get videoStreamMerger() {
		if (!this._videoStreamMerger) {
			this._videoStreamMerger = new VideoStreamMerger({
				canvasWidth: 1280,
				canvasHeight: 720,
			});
			this._videoStreamMerger.start();
		}
		return this._videoStreamMerger;
	}
	public set videoStreamMerger(value: VideoStreamMerger | undefined) {
		this._videoStreamMerger = value;
	}

	cameraStream?: MediaStream;

	// | undefined {
	// 	if (this.videoStreamMerger?.result) return this.videoStreamMerger.result;
	// 	return undefined;
	// }
	// public set cameraStream(newStream: MediaStream | undefined) {
	// 	const nbVideoTracks = newStream?.getVideoTracks()?.length ?? 0;
	// 	if (nbVideoTracks > 0) {
	// 		if (this.recordingProps.debug) console.log('[RecorderService]](setter stream)', 'with video');
	// 	} else {
	// 		if (this.recordingProps.debug) console.log('[RecorderService]](setter stream)', 'with video');
	// 	}

	// 	if (newStream)
	// 		this.videoStreamMerger?.addStream(newStream, {
	// 			keepRatio: true,
	// 			// useComputedVideoDimsForCanvas: true,
	// 			horizontalOffset: 50,
	// 			verticalOffset: 50,
	// 			// customMaxWidth: this.videoStreamMerger.canvasWidth,
	// 			// customMaxHeight: this.videoStreamMerger.canvasHeight,
	// 			customMaxHeight: 150,
	// 			customMaxWidth: 150,
	// 		});
	// }

	callback?: (blob: File, recordingTargetName?: string) => void;

	mediaRecorder?: MediaRecorder;

	public selectedAudioFormat: string;
	public selectedVideoFormat: string;
	public selectedFormat: string;

	// current state of the recording repository
	recordingProps: RecordingProps = DEFAULT_RECORDING_PROPS;

	public chunks: Blob[] = [];

	recordingTimeHistory: { key: 'data' | 'start' | 'pause' | 'resume' | 'stop'; time: number }[] = [];

	private _preventDeviceToSleep = new PreventDeviceToSleep();

	constructor(
		@Inject(DOCUMENT) private document: Document,
		private notificationsService: NotificationsService,
		private _recordingRepository: RecordingRepository,
		private _amplitudeService: AmplitudeService
	) {
		this._amplitudeService.saveEvent('userAgent', { userAgent: navigator.userAgent });
		try {
			// check if we are in a webview
			if (isWebview(navigator.userAgent)) {
				// // open same page in system window
				// // this.notificationsService.warning('Webview detected', 'Please open this page in the system window.');
				// if (localStorage.getItem('webviewWarning') !== 'true') {
				// 	// set cooki to avoid doing it again
				// 	localStorage.setItem('webviewWarning', 'true');
				// 	window.open(window.location.href, '_system');
				// }
				console.error('webview detected', navigator.userAgent);
			}
		} catch (e) {
			console.error('Error while trying to leave webview', e);
		}

		// subscribe to the recording props from recording repository
		this._recordingRepository.recordingProps$
			.pipe(
				tap((props) => {
					this.recordingProps = props;
					// console.log('Recording props updated (seen by recorder service', props,')');
				})
			)
			.subscribe();

		this._recordingRepository.setRecordingProps({
			// debug: true,
			mediaRecorderSupported: true,
			recordingState: 'ready-to-record',
		});

		const supportedVideoMimeTypes = getSupportedVideoMimeTypes();
		if (this.recordingProps.debug)
			console.log(
				'%c[RecorderService](constructor) Best supported video mime types by priority : ',
				'color:cyan',
				supportedVideoMimeTypes[0]
			);

		this.selectedVideoFormat = supportedVideoMimeTypes[0];
		const supportedAudioMimeTypes = getSupportedAudioMimeTypes(undefined, this.recordingProps.debug);
		if (this.recordingProps.debug)
			console.log(
				'%c[RecorderService](constructor) Best supported audio mime types by priority: ',
				'color:cyan',
				supportedAudioMimeTypes[0]
			);
		if (this.recordingProps.debug)
			console.log(
				'%c[RecorderService](constructor) All supported audio mime types ordered by priority : ',
				'color:cyan',
				supportedAudioMimeTypes
			);
		this.selectedAudioFormat = supportedAudioMimeTypes[0];
		this.selectedFormat = supportedAudioMimeTypes[0];

		// Some browsers partially implement mediaDevices. We can't just assign an object
		// with getUserMedia as it would overwrite existing properties.
		// Here, we will just add the getUserMedia property if it's missing.

		if (navigator?.mediaDevices?.getUserMedia === undefined) {
			console.warn('%c[RecorderService](constructor) getUserMedia %cnot supported', 'color:cyan', 'color:red');
			this.notificationsService.warning(
				'This device does not support media recording. Please try another device if you plan on recording audio.',
				'Device not supported'
			);
		} else {
			if (this.recordingProps.debug)
				console.log('%c[RecorderService](constructor) getUserMedia %csupported', 'color:cyan', 'color:green');
			this.listAudioDevices({ removeMicBrowser: true, canAskForPermission: false });
			this.listVideoDevices({ removeMicBrowser: true, canAskForPermission: false, includeAudio: false });
		}
	}

	///////////////////////////////////////////////
	//                                           //
	//                   RECORD                  //
	//                                           //
	///////////////////////////////////////////////

	async launchDevices(streamCallback?: (stream: MediaStream) => void, errorCallback?: () => void) {
		if (this.recordingProps.debug) console.log('%c[RecorderService](launchDevices) called.', 'color:cyan');

		if (this.recordingProps.occupied) {
			if (this.recordingProps.debug)
				console.log(
					'%c[RecorderService](launchDevices) %crecorder occupied.',
					'color:cyan',
					'color:red',
					this.recordingProps.recordingTargetName,
					this.recordingProps.recordingState
				);
			return;
		}

		// this.stopRecording();

		this._recordingRepository.setRecordingProps({
			streamState: 'asked',
		});
		// ensure device(s) access
		try {
			await this.listAudioDevices({ removeMicBrowser: false, canAskForPermission: true });
			if (this.recordingProps.withVideo) {
				await this.listVideoDevices({ removeMicBrowser: false, canAskForPermission: true, includeAudio: false });
			}
		} catch (error) {
			console.error('%c[RecorderService](launchDevices) %cerror: ', 'color:cyan', 'color:red', error);
			this._recordingRepository.setRecordingProps({
				streamState: 'error',
				recordingState: 'error',
			});
			this.stopRecording();
			if (errorCallback) errorCallback();
		}

		if (this.recordingProps.withScreen) {
			const t = await navigator.mediaDevices
				.getDisplayMedia({
					video: {
						// 4K: 3840x2160
						// 720p: 1280x720
						// 1080p: 1920x1080
						// width: { ideal: 1280 },
						height: 720,
					},
				})
				.then((newDisplayStream) => {
					this.videoStreamMerger?.addStream(newDisplayStream, {
						keepRatio: true,
						useComputedVideoDimsForCanvas: true,
						// horizontalOffset: 50,
						// verticalOffset: 50,
						// customMaxWidth: this.videoStreamMerger.canvasWidth,
						// customMaxHeight: this.videoStreamMerger.canvasHeight,
						// customMaxHeight: 150,
						// customMaxWidth: 150,
					});
					return this.videoStreamMerger;
				})
				.catch((error) => {
					console.error(
						'%c[RecorderService](launchDevices) %cerror for screen sharing: ',
						'color:cyan',
						'color:red',
						error
					);
					if (errorCallback) errorCallback();
				});
			if (!t) {
				this.notificationsService.warning('Screen sharing not available.');
				setTimeout(() => {
					this.stopRecording();
				}, 100);
				return;
			} else {
				console.log('screen sharing available');
			}
		}

		const constraints = {
			audio: {
				deviceId: {
					exact: this.recordingProps.microphoneAccessGranted
						? this.recordingProps.selectedAudioDevice?.deviceId
						: undefined,
				},
			},
			...(this.recordingProps.withVideo
				? {
						video: {
							deviceId: {
								exact: this.recordingProps.cameraAccessGranted
									? this.recordingProps.selectedVideoDevice?.deviceId
									: undefined,
							},
						},
				  }
				: {}),
		};

		try {
			if (this.recordingProps.debug)
				console.log(
					'%c[RecorderService](launchDevices) %cstream asked ',
					'color:cyan',
					'color:green',
					'with this constraints:',
					constraints
				);

			navigator.mediaDevices
				.getUserMedia(constraints)
				.then((newCameraStream) => {
					this.cameraStream = newCameraStream;

					if (this.recordingProps.withScreen && this.videoStreamMerger) {
						this.videoStreamMerger.addStream(newCameraStream, {
							keepRatio: true,
							// useComputedVideoDimsForCanvas: true,
							horizontalOffset: this.videoStreamMerger.canvasWidth - 50 - 150,
							verticalOffset: this.videoStreamMerger.canvasHeight - 50 - 150,
							// customMaxWidth: this.videoStreamMerger.canvasWidth,
							// customMaxHeight: this.videoStreamMerger.canvasHeight,
							customMaxHeight: 150,
							customMaxWidth: 150,
						});
					}

					if (this.recordingProps.debug)
						console.log(
							'%c[RecorderService](launchDevices) %cstream obtained. ',
							'color:cyan',
							'color:green',
							this.cameraStream
						);

					this._recordingRepository.setRecordingProps({
						streamState: 'granted',
					});

					this.selectedFormat = this.recordingProps.withVideo ? this.selectedVideoFormat : this.selectedAudioFormat;

					let streamToUse;
					if (this.recordingProps.withScreen && this.videoStreamMerger?.result) {
						console.log('using merged result');

						streamToUse = this.videoStreamMerger.result;
					} else {
						console.log('using default camerea stream');

						streamToUse = newCameraStream;
					}
					this.mediaRecorder = new MediaRecorder(streamToUse, {
						mimeType: this.selectedFormat,
					});
					if (this.recordingProps.debug)
						console.log(
							'%c[RecorderService](launchDevices) %cmedia recorder created.',
							'color:cyan',
							'color:green',
							{ selectedFormat: this.selectedFormat }
						);

					if (streamCallback) {
						streamCallback(streamToUse);
					}

					const handler = (event: Event) => {
						this._processMediaRecorderEvents(event);
					};
					this._addEvents(handler);
				})
				.catch((error) => {
					console.error('%c[RecorderService](launchDevices) %cerror: ', 'color:cyan', 'color:red', error);
					this._recordingRepository.setRecordingProps({
						streamState: 'error',
						recordingState: 'error',
					});
					this.stopRecording();
					if (errorCallback) errorCallback();
				});
		} catch (error) {
			console.error('%c[RecorderService](launchDevices) %cerror: ', 'color:cyan', 'color:red', error);
			this._recordingRepository.setRecordingProps({
				streamState: 'error',
				recordingState: 'error',
			});
			this.stopRecording();
		}
	}

	async startRecording(recordingTargetName: string, errorCallback?: () => void) {
		if (this.recordingProps.occupied) {
			if (this.recordingProps.debug)
				console.log(
					'%c[RecorderService](startRecording) %calready occupied for this target: ',
					'color:cyan',
					'color:red',
					this.recordingProps.recordingTargetName,
					this.recordingProps.recordingState
				);
			return;
		}

		// reset recording history
		this.recordingTimeHistory = [];

		//Prevent device to go to sleep mode
		this._preventDeviceToSleep.enable();

		// ensure device(s) access AGAIN
		await this.listAudioDevices({ removeMicBrowser: false, canAskForPermission: true });
		if (this.recordingProps.withVideo) {
			await this.listVideoDevices({ removeMicBrowser: false, canAskForPermission: true, includeAudio: false });
		}

		if (!this.cameraStream || !this.mediaRecorder) {
			if (this.recordingProps.debug)
				console.log(
					'%c[RecorderService](startRecording) %cstream or media recorder missing to record. Stopping everything ',
					'color:cyan',
					'color:red',
					this.recordingProps.recordingTargetName,
					this.recordingProps.recordingState,
					this.cameraStream,
					this.mediaRecorder
				);
			this.stopRecording();
			return;
		}

		try {
			this._recordingRepository.setRecordingProps({
				recordingState: 'recording-asked',
				recordingTargetName,
			});
			if (this.recordingProps.debug)
				console.log(
					'%c[RecorderService](startRecording) %crecording asked for this target: ',
					'color:cyan',
					'color:green',
					recordingTargetName
				);

			// TODO: mettre du delai ici pour laisser chrome se lancer
			// TODO: afficher le buffer intermediaire
			// TODO: afficher le chrono
			this.mediaRecorder.start(1000);
			// this.mediaRecorder.start();
		} catch (error) {
			console.error('%c[RecorderService](startRecording) %cerror: ', 'color:cyan', 'color:red', error);
			this._recordingRepository.setRecordingProps({
				recordingState: 'error',
			});
			this.stopRecording();
			if (errorCallback) errorCallback();
		}
	}

	private _addEvents(handler: (event: Event) => void) {
		if (!this.mediaRecorder) return;
		MEDIARECORDER_EVENTS.forEach((event) => {
			this.mediaRecorder?.addEventListener(event, handler);
		});
	}

	private _processMediaRecorderEvents(event: Event): void {
		switch (event.type) {
			case 'dataavailable': {
				this.chunks.push((event as MediaRecorderEventMap['dataavailable']).data);

				this._updateRecordingTime({
					key: 'data',
					time: new Date().getTime(),
				});
				break;
			}
			case 'error': {
				this._recordingRepository.setRecordingProps({
					recordingState: 'error',
				});
				this.stopRecording();
				break;
			}
			case 'pause': {
				this._recordingRepository.setRecordingProps({
					recordingState: 'paused',
				});
				this._updateRecordingTime({
					key: 'pause',
					time: new Date().getTime(),
				});
				break;
			}
			case 'resume': {
				this._recordingRepository.setRecordingProps({
					recordingState: 'recording',
				});

				this._updateRecordingTime({
					key: 'resume',
					time: new Date().getTime(),
				});
				break;
			}
			case 'start': {
				this._recordingRepository.setRecordingProps({
					recordingState: 'recording',
				});

				this._updateRecordingTime({
					key: 'start',
					time: new Date().getTime(),
				});

				break;
			}
			case 'stop': {
				this._updateRecordingTime({
					key: 'stop',
					time: new Date().getTime(),
				});

				const blob = new Blob(this.chunks, { type: this.selectedFormat });

				if (this.recordingProps.debug) console.log('Blob type:', blob.type);

				let fileExtension = blob.type.split('/')[1];
				const fileType = blob.type.split('/')[0] as 'video' | 'audio';
				if (fileExtension.indexOf(';') !== -1) {
					// extended mimetype, e.g. 'video/webm;codecs=vp8,opus'
					fileExtension = fileExtension.split(';')[0];
				}

				const filename = Date.now() + '_' + fileType;
				const fileFullName = filename + '.' + fileExtension;

				const newFile = new File([blob], fileFullName, {
					type: blob.type,
				});

				const html_media_element = document.createElement(fileType);

				html_media_element.onloadedmetadata = () => {
					// it should already be available here
					console.log(
						'%c[RecorderService](startRecording) %c duration before trick:' + html_media_element.duration,
						'color:cyan',
						'color:goldenrod'
					);
					// handle chrome's bug
					// eslint-disable-next-line no-constant-condition
					if (html_media_element.duration === Infinity) {
						// set it to bigger than the actual duration
						html_media_element.currentTime = 1e101;
						html_media_element.ontimeupdate = () => {
							// remove callback to avoid infinite loop
							html_media_element.ontimeupdate = () => {
								return;
							};
							console.log(
								'%c[RecorderService](startRecording) %c duration after trick:' + html_media_element.duration,
								'color:cyan',
								'color:goldenrod'
							);
							html_media_element.currentTime = 0;
							fixWebmDuration(newFile, 1000 * html_media_element.duration).then((data) => {
								if (this.recordingProps.debug)
									console.log('result from fixWebmDuration', {
										data,
										recordingTargetName: this.recordingProps.recordingTargetName,
									});
								if (this.callback) {
									this.callback(data, this.recordingProps.recordingTargetName);
									this.callback = undefined;
								}
								if (this.recordingProps.downloadFileAfterRecording)
									RecordRTC.invokeSaveAsDialog(data, 'recording');
							});
						};
					} else {
						if (this.callback) {
							this.callback(newFile, this.recordingProps.recordingTargetName);
							this.callback = undefined;
						}
						if (this.recordingProps.downloadFileAfterRecording) RecordRTC.invokeSaveAsDialog(newFile, 'recording');
					}
				};

				html_media_element.src = URL.createObjectURL(newFile);

				try {
					if (this.cameraStream)
						this.cameraStream
							.getTracks() // get all tracks from the MediaStream
							.forEach((track) => track.stop()); // stop each of them
				} catch (err) {
					// console.log({ err })
				}

				this._recordingRepository.setRecordingProps({
					recordingState: 'stopped',
				});

				this.chunks = [];
				this.mediaRecorder = undefined;
				this.cameraStream = undefined;

				break;
			}
			case 'warning':
				console.warn('%c[RecorderService](_updateStateEvents) %cwarning: ', 'color:cyan', 'color:orange', event);
				break;
			default:
				console.warn('%c[RecorderService](_updateStateEvents) %cunknown event: ', 'color:cyan', 'color:orange', event);
				break;
		}
	}

	private _updateRecordingTime(a: { key: 'data' | 'start' | 'pause' | 'resume' | 'stop'; time: number }) {
		this.recordingTimeHistory.push(a);

		const reducedRecordingTimeHistory = this.recordingTimeHistory.reduce(
			(prev, now) => {
				if (this.recordingProps.debug) console.log(prev, now);

				if (now.key === 'start') {
					// reset
					return {
						cumulated: 0,
						lastTime: now.time,
						lastState: now.key,
					};
				}
				if (now.key === 'resume') {
					// update lastTime
					return {
						cumulated: prev.lastTime, // no change
						lastTime: now.time,
						lastState: now.key,
					};
				}
				if (now.key === 'pause') {
					// add diff
					return {
						cumulated: prev.cumulated + now.time - prev.lastTime,
						lastTime: now.time,
						lastState: now.key,
					};
				}
				if (now.key === 'data') {
					// add diff
					return {
						cumulated: prev.cumulated + now.time - prev.lastTime,
						lastTime: now.time,
						lastState: now.key,
					};
				}
				if (now.key === 'stop' && (prev.lastState === 'start' || prev.lastState === 'resume')) {
					// add diff if it was recording after start
					return {
						cumulated: prev.cumulated + now.time - prev.lastTime,
						lastTime: now.time,
						lastState: now.key,
					};
				}
				if (now.key === 'stop' && prev.lastState === 'pause') {
					// no diff: was already paused
					return {
						cumulated: prev.cumulated,
						lastTime: now.time,
						lastState: now.key,
					};
				}
				return prev;
			},

			{ cumulated: 0, lastTime: 0, lastState: undefined } as {
				cumulated: number;
				lastTime: number;
				lastState: string | undefined;
			}
		);
		this._recordingRepository.setRecordingProps({
			recordedDuration: reducedRecordingTimeHistory.cumulated / 1000,
		});
	}

	pauseRecording(): void {
		if (!this.mediaRecorder) {
			console.warn(
				'%c[RecorderService](pauseAudioRecording) %cAsked to pause recording but no media recorder available...',
				'color:cyan',
				'color:goldenrod'
			);
			return;
		}
		if (this.recordingProps.debug)
			console.log(
				'%c[RecorderService](pauseAudioRecording) %cAsked to pause recording...',
				'color:cyan',
				'color:goldenrod',
				this.recordingProps.recordingTargetName
			);
		if (this.mediaRecorder.state === 'recording') {
			//Allow device to go to sleep mode
			this._preventDeviceToSleep.disable();

			this.mediaRecorder.pause();
		} else {
			console.warn('Asked to pause recording but we are not recording.', this.mediaRecorder.state);
		}
	}

	resumeRecording(): void {
		if (!this.mediaRecorder) {
			console.warn(
				'%c[RecorderService](resumeAudioRecording) %cAsked to resume recording but no media recorder available...',
				'color:cyan',
				'color:goldenrod'
			);
			return;
		}
		if (this.recordingProps.debug)
			console.log(
				'%c[RecorderService](resumeAudioRecording) %cAsked to resume recording...',
				'color:cyan',
				'color:goldenrod',
				{
					'recorderRTC.state': this.mediaRecorder?.state,
				}
			);
		if (this.mediaRecorder.state === 'paused') {
			//Prevent device to go to sleep mode
			this._preventDeviceToSleep.enable();

			this.mediaRecorder.resume();
		} else {
			console.warn('Asked to resume recording but we are not paused.', this.mediaRecorder.state);
		}
	}

	cancelRecording(): void {
		this.callback = undefined;
		this._recordingRepository.setRecordingProps({
			recordingState: 'stopped-asked',
		});
		this.stopRecording();
	}

	stopTracks() {
		try {
			if (this.cameraStream) {
				this.cameraStream
					.getTracks() // get all tracks from the MediaStream
					.forEach((track) => track.stop()); // stop each of them
				this.cameraStream = undefined;
			}
		} catch (err) {
			// console.log({ err })
		}
	}

	stopRecording(callback?: (file: File, recordingTargetName?: string) => void): void {
		this._recordingRepository.setRecordingProps({
			recordingState: 'stopped-asked',
		});

		//Allow device to go to sleep mode
		this._preventDeviceToSleep.disable();

		this.callback = callback;

		if (this.mediaRecorder) {
			if (this.mediaRecorder.state !== 'recording' && this.mediaRecorder.state !== 'paused') {
				console.warn(
					'Askedif (this.recordingProps.debug) to stop recording but we are not recording.',
					this.mediaRecorder.state
				);
			} else {
				this.mediaRecorder.stop();
			}
		}

		this.videoStreamMerger?.stop();
		this.videoStreamMerger?.destroy();
		this.videoStreamMerger = undefined;

		this.stopTracks();

		this._recordingRepository.setRecordingProps({
			recordingState: 'stopped',
			recordedDuration: 0,
		});
	}

	///////////////////////////////////////////////
	//                                           //
	//                   AUDIO                   //
	//                                           //
	///////////////////////////////////////////////

	setAudioDevice(selectedAudioDevice?: MediaDeviceInfo): void {
		this._recordingRepository.setRecordingProps({
			selectedAudioDevice,
		});
		if (this.recordingProps.debug) console.log('YOU SAVED THIS AUDIO DEVICE:', selectedAudioDevice);
	}

	setAudioDeviceById(deviceId: string): void {
		const selectedAudioDevice = this.recordingProps.availableAudioDevices.find((device) => device.deviceId === deviceId);
		this._recordingRepository.setRecordingProps({
			selectedAudioDevice,
		});
		if (this.recordingProps.debug) console.log('YOU SAVED THIS AUDIO DEVICE:', selectedAudioDevice);
	}

	logAudioSituation(message: string) {
		if (this.recordingProps.debug) console.log('%c---------------' + message + '---------------', 'color:cyan');
		if (this.recordingProps.debug)
			console.log('%cSelected audio device id:', 'color:cyan', this.recordingProps.selectedAudioDevice);
		if (this.recordingProps.debug)
			console.log('%cMicrophone accessible:', 'color:cyan', this.recordingProps.microphoneAccessGranted);
		if (this.recordingProps.debug)
			console.log(
				'%cdevices:',
				'color:cyan',
				this.recordingProps.availableAudioDevices.length,
				this.recordingProps.availableAudioDevices
			);
		if (this.recordingProps.debug) console.log('%c---------------------------------------------', 'color:cyan');
	}
	logVideoSituation(message: string) {
		if (this.recordingProps.debug) console.log('%c---------------' + message + '---------------', 'color:cyan');
		if (this.recordingProps.debug)
			console.log('%cSelected video device id:', 'color:cyan', this.recordingProps.selectedVideoDevice);
		if (this.recordingProps.debug)
			console.log('%cCamera accessible:', 'color:cyan', this.recordingProps.cameraAccessGranted);
		if (this.recordingProps.debug)
			console.log(
				'%cdevices:',
				'color:cyan',
				this.recordingProps.availableVideoDevices.length,
				this.recordingProps.availableVideoDevices
			);
		if (this.recordingProps.debug) console.log('%c---------------------------------------------', 'color:cyan');
	}

	private _processAvailableAudioDeviceList(availableAudioDevices: MediaDeviceInfo[]) {
		if (this.recordingProps.debug)
			console.log(
				'%cAvailable audio devices:%c' + availableAudioDevices.length,
				'color:aqua',
				'color:green',
				availableAudioDevices
			);

		// CHECKING FOR THE PRESENCE OF THE PREVIOUSLY SELECTED
		const selectedAudioDevice = availableAudioDevices.find(
			(device) =>
				device.deviceId == this.recordingProps.selectedAudioDevice?.deviceId &&
				device.label == this.recordingProps.selectedAudioDevice?.label
		);
		const newMatchingAudioDevice = availableAudioDevices.find(
			(device) => device.deviceId == this.recordingProps.selectedAudioDevice?.deviceId
		);

		if (selectedAudioDevice) {
			// we can list devices AND we have still the selected one in the list
			this.setAudioDeviceById(selectedAudioDevice.deviceId);
		} else if (newMatchingAudioDevice) {
			// we found a device with the same deviceId (so not same label)
			// this should happen for default OS mics
			this.setAudioDeviceById(newMatchingAudioDevice.deviceId);
			this.notificationsService.success(
				'You are now using this microphone: ' + newMatchingAudioDevice.label + ').',
				'Microphone changed'
			);
		} else if (this.recordingProps.selectedAudioDevice) {
			// value stored is not null, hence a choice was previsouly made but is not found anymore
			if (this.recordingProps.debug)
				console.log(
					'%cAudio device selected and %c NOT available anymore',
					'color:aqua',
					'color:red',
					this.recordingProps.selectedAudioDevice
				);
			const defaultAudioDeviceInfo =
				availableAudioDevices.find((audioDeviceInfo: MediaDeviceInfo) =>
					audioDeviceInfo.deviceId.includes('default')
				) || availableAudioDevices[0];
			this.setAudioDeviceById(defaultAudioDeviceInfo.deviceId);
			this.notificationsService.warning(
				'The microphone you selected is not available. Using the default one (' + defaultAudioDeviceInfo.label + ')',
				'Microphone replaced'
			);
		} else {
			// nothing stored yet, using default
			if (this.recordingProps.debug) console.log('%cNo microphone selected. Using default one', 'color:aqua');
			const defaultAudioDeviceInfo =
				availableAudioDevices.find((deviceInfo: MediaDeviceInfo) => deviceInfo.deviceId == 'default') ||
				availableAudioDevices[0];
			this.setAudioDeviceById(defaultAudioDeviceInfo.deviceId);
			// this.notificationsService.info(
			// 	'Using this microphone: ' + defaultAudioDeviceInfo.label + ')',
			// 	'Microphone selected'
			// );
		}
	}

	async listAudioDevices(
		//
		options: { removeMicBrowser: boolean; canAskForPermission: boolean } = {
			removeMicBrowser: true,
			canAskForPermission: true,
		},
		errorCallback?: () => void
	): Promise<boolean> {
		if (this.recordingProps.debug) console.log('%c[RecorderService](listAudioDevices)', 'color:cyan');
		let devices: MediaDeviceInfo[] = [];

		try {
			if (!navigator.mediaDevices.enumerateDevices) {
				console.warn(
					'%c[RecorderService](listAudioDevices) %cNo enumerateDevices available...',
					'color:cyan',
					'color:goldenrod'
				);
				return false;
			}
			devices = await navigator.mediaDevices.enumerateDevices();
		} catch (enumerateDeviceError: any) {
			this.notificationsService.warning("We can't access your media devices.", 'No media device detected');
			this.handleAudioError(enumerateDeviceError);
			console.error('[RecorderService](listAudioDevices)', 'Error while enumerating devices', { enumerateDeviceError });
		}
		if (this.recordingProps.debug) console.log('All available devices:', { devices });
		const availableAudioDevices = devices.filter(
			(d) => d.deviceId && d.kind == 'audioinput' && !d.label.toLowerCase().includes('virtual')
		);
		this._recordingRepository.setRecordingProps({
			availableAudioDevices,
		});

		let shouldAskForAudioPermission = false;

		if (availableAudioDevices.length > 0) {
			// we have access to an audio device list and it's not empty
			this._recordingRepository.setRecordingProps({
				microphoneAccessGranted: true,
			});
			this._processAvailableAudioDeviceList(availableAudioDevices);
		} else {
			// we don't have access to audio device list or the audio device list is empty
			if (this.recordingProps.debug)
				console.log(
					'%cAvailable audio devices:%c' + availableAudioDevices.length,
					'color:aqua',
					'color:red',
					availableAudioDevices
				);
			shouldAskForAudioPermission = true;
			this._recordingRepository.setRecordingProps({
				microphoneAccessGranted: false,
			});
		}

		// check if we have mic access
		if (!this.recordingProps.microphoneAccessGranted) {
			shouldAskForAudioPermission = true;
		}

		if (!(options.canAskForPermission && shouldAskForAudioPermission)) return false;

		if (this.recordingProps.debug) console.log('%cRequesting "getUserMedia" with audio:true constraint:', 'color:aqua');
		await navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then(async (stream: MediaStream) => {
				this.cameraStream = stream;

				if (this.recordingProps.debug)
					console.log('%cSuccessful %caccess to user media (audio).', 'color:green', 'color:aqua', stream);
				this._recordingRepository.setRecordingProps({
					microphoneAccessGranted: true,
				});
				return navigator.mediaDevices.enumerateDevices();
			})
			.then((availableDevices: MediaDeviceInfo[]) => {
				const availableAudioDevices = availableDevices.filter(
					(d) => d.deviceId && d.kind == 'audioinput' && !d.label.toLowerCase().includes('virtual')
				);
				this._recordingRepository.setRecordingProps({
					availableAudioDevices,
				});

				if (availableAudioDevices.length > 0) {
					// we have access to device list and it's not empty
					this._processAvailableAudioDeviceList(availableAudioDevices);
				} else {
					if (this.recordingProps.debug)
						console.log(
							'%c(listAudioDevices) Even with granted access to devices %cnothing was found!',
							'color:aqua',
							'color:red'
						);
					this.notificationsService.warning(
						'We found no microphone: does your device have a microphone and did you grant access to Rumble Studio?',
						'No microphone found',
						undefined,
						undefined,
						20000
					);
					throw { name: 'NotFoundError' };
				}
			})
			.catch((err) => {
				this.handleAudioError(err);
				if (errorCallback) errorCallback();
			});

		if (options.removeMicBrowser) {
			this.stopRecording();
		}
		return this.recordingProps.microphoneAccessGranted;
	}

	handleAudioError(error: { message: string; name: string }) {
		this.logAudioSituation('Beginning of handleError');

		this._recordingRepository.setRecordingProps({
			microphoneAccessGranted: false,
		});

		if (this.recordingProps.debug) console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
		if (error.name === 'PermissionDismissedError') {
			if (this.recordingProps.debug) console.log('Setting mic state as prompt due to user dismiss');
			this.notificationsService.warning(
				'You dismissed the microphone permission modal. Please grant microphone access and reload the page.',
				'Microphone access'
			);
		} else if (error.name === 'PermissionDeniedError' || error.name === 'NotAllowedError') {
			if (this.recordingProps.debug) console.log('Setting mic state as denied due to user denial');
			this.notificationsService.warning(
				'Your microphone seems disabled. Please change your navigator option and reload the page. (Click on the small locket or microphone in the address bar or look for website settings in the option menu)',
				'Microphone access',
				{ timeOut: 0, extendedTimeOut: 0 }
			);
		} else if (error.name === 'NotFoundError') {
			if (this.recordingProps.debug)
				console.log('Setting mic state as prompt due to absence of microphone', 'Microphone access');
			this.notificationsService.error(
				'We did not find any microphone. Please unplug and plug again then refresh the page or change your device.',
				'Microphone access'
			);
		} else {
			this._recordingRepository.setRecordingProps({
				selectedAudioDevice: undefined,
			});
			if (this.recordingProps.debug) console.log('Error: no access to microphone:', error, error.name);
			this.notificationsService.error(
				'We had a problem looking for a microphone. Do you have one and is it accessible?',
				'Microphone access'
			);
		}
		this.logAudioSituation('End of handleError');
	}

	///////////////////////////////////////////////
	//                                           //
	//                   VIDEO                   //
	//                                           //
	///////////////////////////////////////////////

	setVideoDevice(selectedVideoDevice?: MediaDeviceInfo): void {
		this._recordingRepository.setRecordingProps({
			selectedVideoDevice,
		});
		if (this.recordingProps.debug) console.log('YOU SAVED THIS VIDEO DEVICE:', selectedVideoDevice);
	}

	setVideoDeviceById(videoDeviceId: string): void {
		const selectedVideoDevice = this.recordingProps.availableVideoDevices.find(
			(device) => device.deviceId === videoDeviceId
		);
		this._recordingRepository.setRecordingProps({
			selectedVideoDevice,
		});
		if (this.recordingProps.debug) console.log('YOU SAVED THIS VIDEO DEVICE:', selectedVideoDevice);
	}

	async listVideoDevices(
		//
		options: { removeMicBrowser: boolean; canAskForPermission: boolean; includeAudio: boolean } = {
			removeMicBrowser: true,
			canAskForPermission: true,
			includeAudio: true,
		},
		errorCallback?: () => void
	): Promise<boolean> {
		if (this.recordingProps.debug) console.log('%c[RecorderService](listVideoDevices)', 'color:cyan');
		let devices: MediaDeviceInfo[] = [];

		if (!navigator.mediaDevices.enumerateDevices) {
			console.warn(
				'%c[RecorderService](listVideoDevices) %cNo enumerateDevices available...',
				'color:cyan',
				'color:goldenrod'
			);
			return false;
		}
		try {
			devices = await navigator.mediaDevices.enumerateDevices();
		} catch (enumerateDeviceError) {
			this.notificationsService.warning("We can't access your media devices.", 'No media device detected');
			console.error('[RecorderService](listVideoDevices)', 'Error while enumerating video devices', {
				enumerateDeviceError,
			});
		}
		if (this.recordingProps.debug) console.log('All available video devices:', { devices });
		const availableVideoDevices = devices.filter(
			(d) => d.deviceId && d.kind == 'videoinput' && !d.label.toLowerCase().includes('virtual')
		);
		this._recordingRepository.setRecordingProps({
			availableVideoDevices,
		});

		let shouldAskForVideoPermission = false;

		if (availableVideoDevices.length > 0) {
			// we have access to device list and it's not empty
			this._recordingRepository.setRecordingProps({
				cameraAccessGranted: true,
			});
			this._processAvailableVideoDeviceList(availableVideoDevices);
		} else {
			// we don't have access to video device list or the video device list is empty
			if (this.recordingProps.debug)
				console.log(
					'%cAvailable video devices:%c' + availableVideoDevices.length,
					'color:aqua',
					'color:red',
					availableVideoDevices
				);
			shouldAskForVideoPermission = true;
			this._recordingRepository.setRecordingProps({
				cameraAccessGranted: false,
			});
		}

		// check if we have camera access
		if (!this.recordingProps.cameraAccessGranted) {
			shouldAskForVideoPermission = true;
		}

		if (!(options.canAskForPermission && shouldAskForVideoPermission)) return false;

		if (this.recordingProps.debug) console.log('%cRequesting "getUserMedia" with video:true constraint:', 'color:aqua');
		await navigator.mediaDevices
			.getUserMedia({ video: true, audio: options.includeAudio ? true : undefined })
			.then(async (stream: MediaStream) => {
				this.cameraStream = stream;
				if (this.recordingProps.debug)
					console.log('%cSuccessful %caccess to user media.', 'color:green', 'color:aqua', stream);
				this._recordingRepository.setRecordingProps({
					cameraAccessGranted: true,
				});
				return navigator.mediaDevices.enumerateDevices();
			})
			.then((availableDevices: MediaDeviceInfo[]) => {
				const availableVideoDevices = availableDevices.filter(
					(d) => d.deviceId && d.kind == 'videoinput' && !d.label.toLowerCase().includes('virtual')
				);
				this._recordingRepository.setRecordingProps({
					availableVideoDevices,
				});

				if (availableVideoDevices.length > 0) {
					// we have access to device list and it's not empty
					this._processAvailableVideoDeviceList(availableVideoDevices);
				} else {
					if (this.recordingProps.debug)
						console.log(
							'%c(listVideoDevices) Even with granted access to video devices %cnothing was found!',
							'color:aqua',
							'color:red'
						);
					this.notificationsService.warning(
						'We found no camera: does your device have a camera and did you grant access to Rumble Studio?',
						'No camera found',
						undefined,
						undefined,
						20000
					);
					throw { name: 'NotFoundError' };
				}
			})
			.catch((err) => {
				this.handleVideoError(err);
				if (errorCallback) errorCallback();
			});

		if (options.removeMicBrowser) {
			this.stopRecording();
		}
		return this.recordingProps.cameraAccessGranted;
	}

	private _processAvailableVideoDeviceList(availableVideoDevices: MediaDeviceInfo[]) {
		if (this.recordingProps.debug)
			console.log(
				'%cAvailable video devices:%c' + availableVideoDevices.length,
				'color:aqua',
				'color:green',
				availableVideoDevices
			);

		// CHECKING FOR THE PRESENCE OF THE PREVIOUSLY SELECTED
		const selectedVideoDevice = availableVideoDevices.find(
			(device) =>
				device.deviceId == this.recordingProps.selectedVideoDevice?.deviceId &&
				device.label == this.recordingProps.selectedVideoDevice?.label
		);
		const newMatchingVideoDevice = availableVideoDevices.find(
			(device) => device.deviceId == this.recordingProps.selectedVideoDevice?.deviceId
		);

		if (selectedVideoDevice) {
			// we can list devices AND we have still the selected one in the list
			this.setVideoDeviceById(selectedVideoDevice.deviceId);
		} else if (newMatchingVideoDevice) {
			// we found a device with the same deviceId (so not same label)
			// this should happen for default OS mics
			this.setVideoDeviceById(newMatchingVideoDevice.deviceId);
			this.notificationsService.success(
				'You are now using this camera: ' + newMatchingVideoDevice.label + ').',
				'Camera changed'
			);
		} else if (this.recordingProps.selectedVideoDevice) {
			// value stored is not null, hence a choice was previsouly made but is not found anymore
			if (this.recordingProps.debug)
				console.log(
					'%cVideo device selected but %cNOT available anymore',
					'color:aqua',
					'color:red',
					this.recordingProps.selectedVideoDevice
				);
			const defaultVideoDeviceInfo =
				availableVideoDevices.find((videoDeviceInfo: MediaDeviceInfo) =>
					videoDeviceInfo.deviceId.includes('default')
				) || availableVideoDevices[0];
			this.setVideoDeviceById(defaultVideoDeviceInfo.deviceId);
			this.notificationsService.warning(
				'The camera you selected is not available. Using the default one (' + defaultVideoDeviceInfo.label + ')',
				'Camera replaced'
			);
		} else {
			// nothing stored yet, using default
			if (this.recordingProps.debug) console.log('%cNo camera selected. Using default one', 'color:aqua');
			const defaultVideoDeviceInfo =
				availableVideoDevices.find((deviceInfo: MediaDeviceInfo) => deviceInfo.deviceId == 'default') ||
				availableVideoDevices[0];
			this.setVideoDeviceById(defaultVideoDeviceInfo.deviceId);
			// this.notificationsService.info('Using this camera: ' + defaultVideoDeviceInfo.label + ')', 'Camera selected');
		}
	}

	handleVideoError(error: { message: string; name: string }) {
		this.logVideoSituation('Beginning of handleError');

		this._recordingRepository.setRecordingProps({
			cameraAccessGranted: false,
		});

		if (this.recordingProps.debug) console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
		if (error.name === 'PermissionDismissedError') {
			if (this.recordingProps.debug) console.log('Setting camera state as prompt due to user dismiss');
			this.notificationsService.warning(
				'You dismissed the camera permission modal. Please grant camera access and reload the page.',
				'Camera access'
			);
		} else if (error.name === 'PermissionDeniedError' || error.name === 'NotAllowedError') {
			if (this.recordingProps.debug) console.log('Setting mic state as denied due to user denial');
			this.notificationsService.warning(
				'Your camera seems disabled. Please change your navigator option and reload the page. (Click on the small locket or camera in the address bar or look for website settings in the option menu)',
				'Camera access',
				{ timeOut: 0, extendedTimeOut: 0 }
			);
		} else if (error.name === 'NotFoundError') {
			if (this.recordingProps.debug) console.log('Setting mic state as prompt due to absence of camera', 'Camera access');
			this.notificationsService.error(
				'We did not find any camera. Please unplug and plug again then refresh the page or change your device.',
				'Camera access'
			);
		} else {
			this._recordingRepository.setRecordingProps({
				selectedVideoDevice: undefined,
			});
			if (this.recordingProps.debug) console.log('Error: no access to camera:', error, error.name);
			this.notificationsService.error(
				'We had a problem looking for a camera. Do you have one and is it accessible?',
				'Camera access'
			);
		}
		this.logVideoSituation('End of handleError');
	}
}
