import { Injectable } from '@angular/core';
import { createStore, propsFactory } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

const storeName = 'recording';

export enum RecordingModeOptions {
	replace, // only keep the last recorded track as active
	append, // keep all previously recorded tracks as active and append the new one as active
}
export enum MediaModeOptions {
	audio,
	video,
	screenCapture,
	screenCaptureAndVideo,
}

export interface RecordingProps {
	recordingMode: RecordingModeOptions; // replace or append
	recordActionsPosition: 'default' | 'footer'; // can be toggled by the form container based on the layout size
	recordingState:
		| 'recording' // RTC while recording
		| 'paused' // RTC while paused
		| 'stopped' // RTC after recording
		| 'recording-asked'
		| 'stopped-asked'
		| 'paused-asked'
		| 'inactive' // RTC before recording
		| 'error'
		| 'ready-to-record';
	occupied: boolean;
	/**is the current mediaMode including a video channel ?*/
	withVideo: boolean;
	/** is the current mediaMode a mode for screen sharing? */
	withScreen: boolean;

	streamState: 'not-asked' | 'asked' | 'granted' | 'error';

	debug: boolean;

	microphoneAccessGranted: boolean;
	cameraAccessGranted: boolean;

	availableAudioDevices: MediaDeviceInfo[];
	availableVideoDevices: MediaDeviceInfo[];

	selectedAudioDevice: MediaDeviceInfo | undefined;
	selectedVideoDevice: MediaDeviceInfo | undefined;

	speaking: boolean;
	mediaRecorderSupported: boolean;
	recordingTargetName: string | undefined;
	downloadFileAfterRecording: boolean;
	recordedDuration?: number;

	selectedFormat?: string; // extended mimetype, e.g. 'video/webm;codecs=vp8,opus'
	mediaMode: MediaModeOptions | null;
}

export const DEFAULT_RECORDING_PROPS: RecordingProps = {
	recordingMode: RecordingModeOptions.replace,
	recordActionsPosition: 'default',
	recordingState: 'ready-to-record',
	streamState: 'not-asked',
	occupied: false,
	withVideo: false,
	withScreen: false,
	debug: false,
	microphoneAccessGranted: false,
	cameraAccessGranted: false,

	availableAudioDevices: [],
	availableVideoDevices: [],

	selectedAudioDevice: undefined,
	selectedVideoDevice: undefined,

	speaking: false,
	recordingTargetName: undefined,
	mediaRecorderSupported: false,
	downloadFileAfterRecording: false,
	recordedDuration: undefined,

	mediaMode: MediaModeOptions.audio,
};

export const STARTING_RECORDING_PROPS: Partial<RecordingProps> = {
	recordingMode: RecordingModeOptions.replace,
	recordingState: 'ready-to-record',
	streamState: 'not-asked',
	occupied: false,
	debug: false, // put this to true to get debug info
	speaking: false,
	withVideo: false,
	withScreen: false,
};

export const FEATURE_RECORDING_PIPES = propsFactory('recording', {
	initialValue: DEFAULT_RECORDING_PROPS,
});

@Injectable({ providedIn: 'root' })
export class RecordingRepository {
	public recordingProps$: Observable<RecordingProps>;
	private _persist;

	private _store;

	constructor() {
		this._store = this._createStore();
		this._persist = persistState(this._store, {
			key: storeName,
			storage: localStorageStrategy,
		});
		// this._persist.initialized$.subscribe(() => console.log(storeName + ' initialized', this._store.value));
		this.recordingProps$ = this._store.pipe(FEATURE_RECORDING_PIPES.selectRecording(), shareReplay({ refCount: true }));

		// quick reset
		const recordingProps = {
			...DEFAULT_RECORDING_PROPS,
			...this._store.getValue().recording,
			...STARTING_RECORDING_PROPS,
		};
		this.setRecordingProps(recordingProps);
	}

	public setRecordingProps(recordingProps: Partial<RecordingProps>) {
		// this._store.update(FEATURE_RECORDING_PIPES.updateRecording(recordingProps));
		this._store.update((state) => {
			const newState = { ...state };
			newState.recording = {
				...state.recording,
				...recordingProps,
			};
			newState.recording.occupied = ['recording-asked', 'recording', 'paused-asked', 'paused', 'stopped-asked'].includes(
				newState.recording.recordingState
			);
			newState.recording.withVideo =
				newState.recording.mediaMode === MediaModeOptions.video ||
				newState.recording.mediaMode === MediaModeOptions.screenCaptureAndVideo ||
				newState.recording.mediaMode === MediaModeOptions.screenCapture;

			newState.recording.withScreen =
				newState.recording.mediaMode === MediaModeOptions.screenCaptureAndVideo ||
				newState.recording.mediaMode === MediaModeOptions.screenCapture;

			// console.log('recordingProps', newState);

			return newState;
		});
	}

	public toggleRecordingMode() {
		this._store.update((state) => {
			const newState = { ...state };
			newState.recording.recordingMode =
				newState.recording.recordingMode === RecordingModeOptions.append
					? RecordingModeOptions.replace
					: RecordingModeOptions.append;
			return newState;
		});
	}

	public toggleMediaMode() {
		this._store.update((state) => {
			const newState = { ...state };
			newState.recording.recordingMode =
				newState.recording.recordingMode === RecordingModeOptions.append
					? RecordingModeOptions.replace
					: RecordingModeOptions.append;
			return newState;
		});
	}

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			FEATURE_RECORDING_PIPES.withRecording() // like withProps, but for a specific prop
		);

		return store;
	}
}
