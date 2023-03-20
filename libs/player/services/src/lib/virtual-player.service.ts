// from https://github.com/imsingh/auth0-audio/blob/master/src/app/services/audio.service.ts

import { ElementRef, Injectable } from '@angular/core';
import { FAVORITE_OBJECT_KINDS } from '@rumble-pwa/users/models';
import { cumSum } from '@rumble-pwa/utils';
import { cloneDeep, findIndex, findLastIndex, isEqual, sum } from 'lodash';
import { BehaviorSubject, combineLatest, merge, NEVER, Observable, of, Subject } from 'rxjs';
import { filter, finalize, map, shareReplay, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
// import { Howl, Howler } from 'howler';

const debug = false;

export interface FileForVirtualTrack {
	fileId: string;
	fileSrc: string | undefined;
	fileSynced?: boolean;
	mediaType: 'video' | 'audio';
}

interface Detailed {
	details?: {
		//
		pictureSrcs?: string[];
		title?: string;
		description?: string;
		label?: string;
	};
}

interface Sourced {
	/** Source is the object info needed to make this element a favorite (kind are from FAVORITE_OBJECT_KINDS) */
	source?: {
		id: string;
		kind: FAVORITE_OBJECT_KINDS;
	};
}

interface Transcribed {
	transcript?: {
		originalTranscript?: string;
		editedTranscript?: string;
		canEditTranscript?: boolean;
	};
}

/**
 * A virtualTrack is equivalent to the former PlaylistItem, but it's not persisted in the database and holds directly the
 * information necessary to be played (i.d entityFile ids).
 */
export interface VirtualTrack extends Detailed, Sourced, Transcribed {
	id: string; // unique id for list updates (not necessarily DB related) Mandatory to enable sorting and other operations

	active: boolean;

	files: FileForVirtualTrack[];
}

export interface VirtualPlaylist extends Detailed, Sourced, Transcribed {
	id: string;
	virtualTracks: VirtualTrack[];
	noAutoNext?: boolean;
}

interface StreamState {
	playing: boolean;
	duration: number | undefined;
	buffered?: TimeRanges;
	currentTime: number | undefined;
	canplay: boolean;
	error: boolean;
	hasSrc: boolean;
	unlocked: boolean;
	nextSrc?: string;
	containsVideo: boolean;
}

interface MultiStreamState {
	lastIndexBeingPlayed: number;
	percentageOfLastElementBeingPlayed: number;
	cumulatedPlayedDuration: number;
	durations: number[];
	cumulatedDurations: number[];
	duration: number;
	allSynced?: boolean;
}

interface MediaInfo {
	state$$: BehaviorSubject<StreamState>;
	media: HTMLAudioElement | HTMLVideoElement;
	virtualPlaylistId: string;
	virtualTrackId: string;
	fileId: string;
	mediaType: 'audio' | 'video';
}

export interface VirtualTrackWithStreamStates {
	virtualTrack: VirtualTrack;
	streamStates: StreamState[];
	representativeState: StreamState & MultiStreamState;
}

export interface VirtualPlaylistWithStreamStates {
	id: string;
	virtualPlaylist: VirtualPlaylist;
	virtualTrackWithStreamStates?: VirtualTrackWithStreamStates[];
	representativeState: StreamState &
		MultiStreamState & {
			nbOfActiveTracks: number;
		};
}

export interface MultiSeekEvent {
	indexToSeek: number;
	percentageOfSongToSeek: number;
	play: boolean;
	pause: boolean;
}

function generateCumulativeDurations(newDurations: number[]) {
	// convert real duration (invalid or negative) to
	// a new list for visual representation

	const virtualDurationsArray = newDurations;

	const minSize = 10;
	const maxRatio = 3;

	// longest real duration
	const currentMaxSize = virtualDurationsArray.some((d) => d > 0) ? Math.max(...virtualDurationsArray) : minSize;

	// virtual representation of the longest duration
	const maxSizeToUse = currentMaxSize > maxRatio * minSize ? maxRatio * minSize : currentMaxSize;

	// if negative values: get minimal size for representation
	// if duration bigger than max virtual, then max virtual, else duration directly
	let durationsToUse = virtualDurationsArray
		.map((d) => (d <= 0 ? (d < -1 ? 0 : minSize) : d))
		.map((d) => (d > maxSizeToUse ? maxSizeToUse : d));

	let totalVirtualDuration = 0;
	for (const number of durationsToUse) {
		totalVirtualDuration += number;
	}

	// we normalise duration by the total
	durationsToUse = durationsToUse.map((d) => d / totalVirtualDuration);

	return cumSum(durationsToUse);
}

const CURRENTTIME_RESET = 0;
const AUDIO_EVENTS = [
	'ended',
	'error',
	'play',
	'playing',
	'pause',
	'timeupdate',
	'canplay',
	'loadedmetadata',
	'loadstart',
	'seeked',
];

/*
- Root provided service for multiple playing of audio files.
- Independant of Howler=> actually not: Howler used for auto loading

- If you want to play a simple file: then you create a virtualPlaylist with a single virtual track with a single file id and play it.
 
*/
@Injectable({
	providedIn: 'root',
})
export class VirtualPlayerService {
	/**
	 * Map of virtualPlaylists (passive object that can be updated and holds the virtualTracks)
	 */
	_virtualPlaylists$$Map = new Map<string, BehaviorSubject<VirtualPlaylist | null>>();

	_virtualPlaylistStates$Map = new Map<string, undefined | Observable<VirtualPlaylistWithStreamStates | null>>();
	_virtualPlaylistStatesMap = new Map<string, VirtualPlaylistWithStreamStates | null>();
	_virtualPlaylistCanvasMap = new Map<string, HTMLCanvasElement | null>();

	_clearSubject = new Subject();

	/**
	 * Map of AudioInfo: each file of each virtualTrack has an AudioInfo object to keep track of its state$
	 */
	_mediasMap = new Map<string, MediaInfo>();

	/**
	 * Accept a `VirtualPlaylist` and prep it to be playable.
	 *
	 * Prepping it means building the `Audio()` elements or each `entityFiles`
	 * @param virtualPlaylist Its `.id` property will be used as the key for the `virtualPlaylistsMap$`
	 * @returns
	 */
	upsertVirtualPlaylist$(virtualPlaylist: VirtualPlaylist, destroyer$?: Observable<any>) {
		let virtualPlaylist$$ = this._virtualPlaylists$$Map.get(virtualPlaylist.id);
		if (virtualPlaylist$$) {
			if (isEqual(virtualPlaylist$$.value, virtualPlaylist)) {
				// console.log('%c(upsert: same)', 'color: blue', virtualPlaylist);

				return this._getVirtualPlaylistState$(virtualPlaylist.id, destroyer$);
			}
			// console.log('%c(upsert: new value)', 'color: blue', virtualPlaylist);

			virtualPlaylist$$.next(virtualPlaylist);
			return this._getVirtualPlaylistState$(virtualPlaylist.id, destroyer$);
		} else {
			virtualPlaylist$$ = new BehaviorSubject<VirtualPlaylist | null>(virtualPlaylist);
			this._virtualPlaylists$$Map.set(virtualPlaylist.id, virtualPlaylist$$);
		}
		// console.log('%c(upsert: new playlist)', 'color: blue', virtualPlaylist);
		return this._getVirtualPlaylistState$(virtualPlaylist.id, destroyer$);
	}

	clearVirtualPlaylist(virtualPlaylistId: string) {
		if (debug) console.log('(clear) vp map', virtualPlaylistId);
		const virtualPlaylist$$ = this._virtualPlaylists$$Map.get(virtualPlaylistId);
		if (virtualPlaylist$$) {
			virtualPlaylist$$.complete();
		}
		this._virtualPlaylists$$Map.delete(virtualPlaylistId);

		// const virtualPlaylistState$ = this._virtualPlaylistStates$Map.get(virtualPlaylistId);
		// if (virtualPlaylistState$) {
		// 	virtualPlaylistState$.complete();
		// }
		this._virtualPlaylistStates$Map.delete(virtualPlaylistId);

		this._clearSubject.next(virtualPlaylistId);
	}

	/**
	 * Concatenate ids to get the deterministic audioInfoKey of the audio file in the audiosMap
	 * @param virtualPlaylistId
	 * @param virtualTrackId
	 * @param fileId
	 * @returns
	 */
	private _getMediaInfoKey(virtualPlaylistId: string, virtualTrackId: string, fileId: string) {
		const audioInfoKey = `${virtualPlaylistId}-${virtualTrackId}-${fileId}`;
		return audioInfoKey;
	}

	/**
	 *
	 * @param virtualPlaylistId
	 * @param requester
	 * @returns Observable<StreamState>
	 *
	 */
	private _getVirtualPlaylistState$(
		virtualPlaylistId: string,
		destroyer$?: Observable<any>
	): Observable<VirtualPlaylistWithStreamStates | null> {
		let virtualPlaylistState$ = this._virtualPlaylistStates$Map.get(virtualPlaylistId);
		if (virtualPlaylistState$) {
			// console.log('%c(subscribeToVirtualPlaylistState$)', 'color: cyan', 'called CACHE', virtualPlaylistState$);
			return virtualPlaylistState$;
		}
		// console.log('%c(subscribeToVirtualPlaylistState$)', 'color: cyan', 'called FIRST TIME');

		let virtualPlaylistCached: VirtualPlaylist;
		// let resetTrackIndex = false;

		let virtualPlaylistCheck$$ = this._virtualPlaylists$$Map.get(virtualPlaylistId);
		if (!virtualPlaylistCheck$$) {
			console.warn('virtualPlaylist check must create an empty vp$$', virtualPlaylistId);
			virtualPlaylistCheck$$ = new BehaviorSubject<VirtualPlaylist | null>(null);
			this._virtualPlaylists$$Map.set(virtualPlaylistId, virtualPlaylistCheck$$);
		}
		const virtualPlaylist$$: BehaviorSubject<VirtualPlaylist | null> = virtualPlaylistCheck$$;

		const allDestroyers$ = merge(
			destroyer$ ?? NEVER,
			this._clearSubject.pipe(filter((idToClear) => idToClear === virtualPlaylistId))
		);

		virtualPlaylistState$ = virtualPlaylist$$.pipe(
			takeUntil(allDestroyers$),
			// finalize(() => {
			// 	console.log(`%cFINALIZED vp$$`, 'color: goldenrod;', 'virtualPlaylistState$ on ', virtualPlaylistId);
			// 	// virtualPlaylist$$.complete();
			// 	// this._virtualPlaylists$$Map.delete(virtualPlaylistId);
			// 	// this.logMapsState();
			// }),
			filter((vp) => !isEqual(vp, virtualPlaylistCached)),
			// il faut convertir tout l'ensemble en un gros observable qui
			// contient le state global de la playlist (duree, position,
			// percentage, state) et la meme chose pour chaque track)
			switchMap((virtualPlaylist) => {
				if (!virtualPlaylist) {
					return of(null);
				}
				virtualPlaylistCached = cloneDeep(virtualPlaylist);
				// console.log('RESET TRACK INDEX', virtualPlaylistCached);
				// resetTrackIndex = true;

				const streamStatesPerTrack$ = virtualPlaylist.virtualTracks
					.filter((virtualTrack) => virtualTrack.files.length > 0)
					.map((virtualTrack) => {
						const audioInfos = virtualTrack.files.map((file) => {
							return this._convertFileToMediaInfo(virtualPlaylistId, virtualTrack.id, file, allDestroyers$);
						});
						// console.log('%c(streamStatesPerTrack$) AudioInfos:', 'color: green', audioInfos);

						return combineLatest(audioInfos.map((audioInfo) => audioInfo.state$$));
					});
				return combineLatest(streamStatesPerTrack$).pipe(startWith([]));
			}),
			takeUntil(allDestroyers$),
			map((streamStatesPerTrack) => {
				if (!streamStatesPerTrack || !virtualPlaylistCached) {
					return null;
				}

				// console.log('%c(subscribeToVirtualPlaylistState$)', 'color: cyan', 'regrouping states');

				// regroup all state$[] and merge them too into a single object for the track itself
				const virtualTrackWithStreamStates: VirtualTrackWithStreamStates[] = streamStatesPerTrack.map(
					(streamStates, virtualTrackIndex) => {
						let lastIndexBeingPlayed = findLastIndex(streamStates, (streamState) => streamState.playing);
						if (lastIndexBeingPlayed === -1) {
							lastIndexBeingPlayed = findLastIndex(
								streamStates,
								(streamState) => (streamState.currentTime ?? 0) > 0
							);
						}
						if (lastIndexBeingPlayed === -1) {
							lastIndexBeingPlayed = 0;
						}
						let cumulatedPlayedDuration = 0;
						cumulatedPlayedDuration = streamStates
							.slice(0, lastIndexBeingPlayed + 1)
							.reduce((acc, streamState, currentIndex) => {
								// use currentTime of the file being played
								if (currentIndex === lastIndexBeingPlayed) {
									return acc + (streamState.currentTime ?? 0);
								}
								// use duration if before the file being played,
								return acc + (streamState.duration ?? 0);
							}, 0);
						const percentageOfLastElementBeingPlayed =
							(streamStates[lastIndexBeingPlayed].currentTime ?? 0) /
							(streamStates[lastIndexBeingPlayed].duration ?? Infinity);

						const durations = streamStates.map((streamState) =>
							streamState.canplay && !streamState.error && streamState.hasSrc ? streamState.duration ?? -1 : -2
						);

						const virtualTrackWithStreamStates: VirtualTrackWithStreamStates = {
							virtualTrack: virtualPlaylistCached.virtualTracks[virtualTrackIndex],
							streamStates,
							representativeState: {
								playing: streamStates.some((streamState) => streamState.playing),
								duration: sum(streamStates.map((streamState) => streamState.duration ?? 0)),
								currentTime: sum(streamStates.map((streamState) => streamState.currentTime ?? 0)),
								canplay: streamStates.every((streamState) => streamState.canplay),
								error: streamStates.some((streamState) => streamState.error),
								lastIndexBeingPlayed: lastIndexBeingPlayed,
								percentageOfLastElementBeingPlayed,
								cumulatedPlayedDuration, // should be the same as currentTime
								durations,
								cumulatedDurations: generateCumulativeDurations(durations),
								allSynced: virtualPlaylistCached.virtualTracks[virtualTrackIndex].files.every(
									(file) => file.fileSynced !== false
								),
								hasSrc: streamStates.every((streamState) => streamState.hasSrc),
								unlocked: streamStates.every((streamState) => streamState.unlocked),
								containsVideo: streamStates.some((streamState) => streamState.containsVideo),
							},
						};

						return virtualTrackWithStreamStates;
					}
				);

				// build a representative state for the playlist

				// last index being played
				let lastIndexBeingPlayed = findLastIndex(
					virtualTrackWithStreamStates,
					(streamState) => streamState.representativeState.playing
				);

				// last index with a positive currentTime
				if (lastIndexBeingPlayed === -1) {
					lastIndexBeingPlayed = findLastIndex(
						virtualTrackWithStreamStates,
						(streamState) => (streamState.representativeState.cumulatedPlayedDuration ?? 0) > 0
					);
				}

				// // first index with an active track
				if (
					lastIndexBeingPlayed === -1
					//  || resetTrackIndex
				) {
					lastIndexBeingPlayed = findIndex(
						virtualTrackWithStreamStates,
						(streamState) => streamState.virtualTrack.active ?? false
					);
				}

				// if nothing found yet, use the first one
				if (lastIndexBeingPlayed === -1) {
					lastIndexBeingPlayed = 0;
				}

				let cumulatedPlayedDuration = 0;
				if (virtualTrackWithStreamStates.length > 0)
					cumulatedPlayedDuration = virtualTrackWithStreamStates
						.slice(0, lastIndexBeingPlayed + 1)
						.reduce((acc, streamState, currentIndex) => {
							// if not active we don't count it in the cumulated played duration
							if (!streamState.virtualTrack.active) return acc;

							if (currentIndex === lastIndexBeingPlayed) {
								return acc + streamState.representativeState.cumulatedPlayedDuration;
							}
							return acc + (streamState.representativeState.duration ?? 0);
						}, 0);
				let percentageOfLastElementBeingPlayed = 0;
				if (virtualTrackWithStreamStates.length > 0)
					percentageOfLastElementBeingPlayed =
						virtualTrackWithStreamStates[lastIndexBeingPlayed].representativeState.cumulatedPlayedDuration /
						(virtualTrackWithStreamStates[lastIndexBeingPlayed].representativeState.duration ?? Infinity);

				const durations = virtualTrackWithStreamStates.map(
					(virtualTrackWithStreamStates) =>
						virtualTrackWithStreamStates.virtualTrack.active &&
						virtualTrackWithStreamStates.representativeState.canplay &&
						!virtualTrackWithStreamStates.representativeState.error &&
						virtualTrackWithStreamStates.representativeState.hasSrc
							? virtualTrackWithStreamStates.representativeState.duration ?? -1
							: -2 // using 2 here will be converted in generateCumulativeDurations to take 0 width
				);
				const playlistWithState: VirtualPlaylistWithStreamStates = {
					id: virtualPlaylistId,
					virtualPlaylist: virtualPlaylistCached,
					virtualTrackWithStreamStates,
					representativeState: {
						playing: virtualTrackWithStreamStates.some(
							(virtualTrackWithStreamStates) => virtualTrackWithStreamStates.representativeState.playing
						),
						duration: sum(
							// remove unactive tracks from total duration
							virtualTrackWithStreamStates.map((virtualTrackWithStreamStates) =>
								virtualTrackWithStreamStates.virtualTrack.active
									? virtualTrackWithStreamStates.representativeState.duration
									: 0
							)
						),
						currentTime: sum(
							virtualTrackWithStreamStates.map(
								(virtualTrackWithStreamStates) =>
									virtualTrackWithStreamStates.representativeState.cumulatedPlayedDuration
							)
						),
						canplay: virtualTrackWithStreamStates.every(
							(virtualTrackWithStreamStates) => virtualTrackWithStreamStates.representativeState.canplay
						),
						error: virtualTrackWithStreamStates.some(
							(virtualTrackWithStreamStates) => virtualTrackWithStreamStates.representativeState.error
						),
						lastIndexBeingPlayed,
						percentageOfLastElementBeingPlayed,
						cumulatedPlayedDuration,
						durations,
						cumulatedDurations: generateCumulativeDurations(durations),
						hasSrc: virtualTrackWithStreamStates.every(
							(virtualTrackWithStreamStates) => virtualTrackWithStreamStates.representativeState.hasSrc
						),
						nbOfActiveTracks: virtualTrackWithStreamStates.filter((virtualTrackWithStreamStates) => {
							return virtualTrackWithStreamStates.virtualTrack.active;
						}).length,
						unlocked: virtualTrackWithStreamStates.every((virtualTrackWithStreamStates) => {
							return virtualTrackWithStreamStates.representativeState.unlocked;
						}),
						containsVideo: virtualTrackWithStreamStates.some((virtualTrackWithStreamStates) => {
							return virtualTrackWithStreamStates.representativeState.containsVideo;
						}),
					},
				};

				// this._updatePositions(virtualPlaylistId);
				// console.log(`%c${virtualPlaylistId} playlistWithState`, 'color: #00ff00;');
				// console.log(`[${virtualPlaylistId}] playlistWithState:`, playlistWithState);
				return playlistWithState;
			}),
			tap((playlistWithState) => {
				if (debug) console.log(`[${virtualPlaylistId}] playlistWithState:`, playlistWithState);
				this.__drawVideoForPlaylist(virtualPlaylistId);

				this._virtualPlaylistStatesMap.set(virtualPlaylistId, playlistWithState);
			}),
			finalize(() => {
				// console.log(`%cFINALIZED vp$`, 'color: goldenrod;', 'virtualPlaylistState$ on ', virtualPlaylistId);
				// this._virtualPlaylistStates$Map.delete(virtualPlaylistId);
				// this.logMapsState();
			}),
			shareReplay()
			// 	{
			// 	refCount: true,
			// }
		);

		// virtualPlaylistState$$ = new BehaviorSubject<VirtualPlaylistWithStreamStates | null>(null);
		// console.log(`%c[${virtualPlaylistId}] virtualPlaylistState$$:`, 'color: purple;', virtualPlaylistId);

		// virtualPlaylistState$.subscribe(virtualPlaylistState$$);
		this._virtualPlaylistStates$Map.set(virtualPlaylistId, virtualPlaylistState$);

		// this._logMapsState();
		return virtualPlaylistState$;
	}

	/**
	 * Subscribe to entityFile to update Audio() url (Audio() returns an HTMLAudioElement).
	 * Automatically unsubscribes when virtualPlaylist$$ completes.
	 * @param fileId
	 * @param audioInfoKey
	 * @param destroyer$
	 * @returns
	 */
	private _convertFileToMediaInfo(
		virtualPlaylistId: string,
		virtualTrackId: string,
		file: FileForVirtualTrack,
		destroyer$?: Observable<any>
	): MediaInfo {
		const audioInfoKey = this._getMediaInfoKey(virtualPlaylistId, virtualTrackId, file.fileId);

		let mediaInfo: MediaInfo | undefined = this._mediasMap.get(audioInfoKey);
		if (mediaInfo) {
			if (file.fileSrc && mediaInfo.media.src !== file.fileSrc) {
				if (mediaInfo.state$$.value.playing) {
					if (debug)
						console.log(
							`%c[${virtualPlaylistId}] audioInfo.audio.src update on standby:`,
							'color:orange',
							mediaInfo.media.src.substring(0, 50) +
								'...' +
								mediaInfo.media.src.substring(mediaInfo.media.src.length - 50),
							'->',
							file.fileSrc.substring(0, 50) + '...' + file.fileSrc.substring(file.fileSrc.length - 50)
						);

					// audioInfo.audio.src = fileSrc;
					mediaInfo.state$$.next({
						...mediaInfo.state$$.value,
						hasSrc: true,
						nextSrc: file.fileSrc,
					});

					const unlock = function (e: any) {
						if (
							mediaInfo &&
							mediaInfo.state$$.value.nextSrc &&
							mediaInfo.media.src !== mediaInfo.state$$.value.nextSrc
						) {
							if (debug)
								console.log(
									`%c[${virtualPlaylistId}] audioInfo.audio.src update once at pause time:`,
									'color:blue',
									'New url:',
									mediaInfo.state$$.value.nextSrc.substring(0, 50) +
										'...' +
										mediaInfo.state$$.value.nextSrc.substring(mediaInfo.media.src.length - 50)
								);
							mediaInfo.media.src = mediaInfo.state$$.value.nextSrc;
							mediaInfo.state$$.next({
								...mediaInfo.state$$.value,
								hasSrc: true,
								nextSrc: undefined,
							});
						}

						// Remove the touch start listener.
						mediaInfo?.media.removeEventListener('pause', unlock, true);
					};
					mediaInfo?.media.addEventListener('pause', unlock, true);
				} else {
					if (debug)
						console.log(
							`%c[${virtualPlaylistId}] audioInfo.audio.src updated:`,
							'color:green',
							mediaInfo.media.src.substring(0, 50) +
								'...' +
								mediaInfo.media.src.substring(mediaInfo.media.src.length - 50),
							'->',
							file.fileSrc.substring(0, 50) + '...' + file.fileSrc.substring(file.fileSrc.length - 50)
						);

					mediaInfo.media.src = file.fileSrc;
					mediaInfo.state$$.next({
						...mediaInfo.state$$.value,
						hasSrc: true,
					});
				}
			}
			return mediaInfo;
		}

		let media: HTMLMediaElement;
		if (file.mediaType === 'audio') {
			media = new Audio();
		} else {
			media = document.createElement('video');
			media.setAttribute('playsInline', 'true');
			media.setAttribute('controls', 'false');
		}
		media.preload = 'auto';

		const state$$ = new BehaviorSubject<StreamState>({
			playing: false,
			duration: undefined,
			currentTime: undefined,
			canplay: false,
			error: false,
			buffered: undefined,
			hasSrc: !!file.fileSrc,
			unlocked: false,
			containsVideo: file.mediaType === 'video',
		});

		mediaInfo = {
			state$$,
			media: media,
			virtualPlaylistId: virtualPlaylistId,
			virtualTrackId: virtualTrackId,
			fileId: file.fileId,
			mediaType: file.mediaType,
		};

		this._mediasMap.set(audioInfoKey, mediaInfo);

		const handler = (event: Event) => {
			this._updateStateEvents(audioInfoKey, event);
		};

		this._addEvents(media, AUDIO_EVENTS, handler, file.fileId.substring(0, file.fileId.indexOf('-')));

		const unlock = function (e: any) {
			if (debug) console.log('%c(_addEvents) UNLOCKING', 'color:orange');
			media.load();

			// Remove the touch start listener.
			document.removeEventListener('touchstart', unlock, true);
			document.removeEventListener('touchend', unlock, true);
			document.removeEventListener('click', unlock, true);
			document.removeEventListener('keydown', unlock, true);
		};

		// Setup a touch start listener to attempt an unlock in.
		document.addEventListener('touchstart', unlock, true);
		document.addEventListener('touchend', unlock, true);
		document.addEventListener('click', unlock, true);
		document.addEventListener('keydown', unlock, true);

		if (file.fileSrc) {
			media.src = file.fileSrc;
		}

		if (destroyer$) {
			destroyer$
				.pipe(
					take(1),
					tap(() => {
						media.pause();
						this._removeEvents(media, AUDIO_EVENTS, handler, file.fileId.substring(0, 5));
						media.src = '';
						this._mediasMap.delete(audioInfoKey);
						if (debug)
							console.log(
								`%cCLEARING AUDIO`,
								'color: goldenrod;',
								'audioInfo details on ',
								virtualPlaylistId,
								virtualTrackId,
								file.fileId
							);
						// this.logMapsState();
					})
					// finalize(() => {
					// 	console.log(
					// 		`%cFINALIZED AUDIO`,
					// 		'color: goldenrod;',
					// 		'audioInfo details on ',
					// 		virtualPlaylistId,
					// 		virtualTrackId,
					// 		fileId
					// 	);
					// 	// this.logMapsState();
					// })
				)
				.subscribe();
		}

		return mediaInfo;
	}

	// /**
	//  * Automatically called when the requester is destroyed
	//  * @param audio
	//  * @param handler
	//  */
	// private _clearAudioInfo(audio: HTMLAudioElement, handler: (event: Event) => void, title?: string) {
	// 	// this should unsubscribe all listeners and delete the Audio element
	// 	console.log('%c_clearAudioInfo for ', 'color:orange', title);
	// 	audio.pause(); // stop playing and allow for garbage collection
	// 	this._removeEvents(audio, AUDIO_EVENTS, handler, title);
	// }

	/**
	 * Called by convertEntityFileIdToAudioInfo to add events to the audio element
	 * @param obj
	 * @param events
	 * @param handler
	 */
	private _addEvents(obj: HTMLAudioElement | HTMLVideoElement, events: any[], handler: any, title?: string) {
		events.forEach((event) => {
			// console.log('addEventListener', event, title ? ' to: ' + title : '', obj.src.length);
			obj.addEventListener(event, handler);
		});
	}

	/**
	 * Called by `convertEntityFileIdToAudioInfo` through `_clearAudioInfo` to remove events from the audio element when the requester is destroyed
	 * @param obj
	 * @param events
	 * @param handler
	 */
	private _removeEvents(obj: HTMLAudioElement | HTMLVideoElement, events: any[], handler: any, title?: string) {
		events.forEach((event) => {
			// console.log('removeEventListener', event, title ? ' to: ' + title : '', obj.src.length);
			obj.removeEventListener(event, handler);
		});
	}

	/**
	 * Called by `convertEntityFileIdToAudioInfo` to react to `Audio()` events and update the `state$` of the `AudioInfo`
	 * @param audioInfoKey
	 * @param event
	 * @returns
	 */
	private _updateStateEvents(audioInfoKey: string, event: Event): void {
		const audioInfo = this._mediasMap.get(audioInfoKey);
		if (!audioInfo) return;

		const state: Partial<StreamState> = {};
		const virtualPlaylist = this._virtualPlaylists$$Map.get(audioInfo.virtualPlaylistId)?.getValue();
		if (!virtualPlaylist) return;

		// state.duration = audioInfo.audio.duration;

		switch (event.type) {
			case 'canplay':
				state.duration = audioInfo.media.duration;
				// state.buffered = audioInfo.audio.buffered;
				state.canplay = true;
				state.unlocked = true;
				break;
			case 'play':
				state.playing = true;
				break;
			case 'playing':
				state.playing = true;
				break;
			case 'pause':
				state.playing = false;
				state.currentTime = audioInfo.media.currentTime;
				break;
			case 'timeupdate':
				state.currentTime = audioInfo.media.currentTime;
				if (
					!virtualPlaylist.noAutoNext &&
					audioInfo.state$$.value.playing &&
					audioInfo.media.currentTime === audioInfo.media.duration
				) {
					this._playNext(audioInfoKey);
				}

				break;
			case 'error':
				state.error = true;
				console.error(
					'%cERROR',
					'color: red;',
					'audioInfo details on ',
					audioInfo.virtualPlaylistId,
					audioInfo.virtualTrackId,
					audioInfo.fileId,
					event
				);
				// merge(state, {
				// 	playing: false,
				// 	duration: undefined,
				// 	currentTime: undefined,
				// 	canplay: false,
				// 	error: true, // ERROR !
				// });
				break;
			case 'ended':
				// this._playNext(audioInfoKey, audioInfo.state$.value.playing);
				break;
			case 'seeked':
				state.currentTime = audioInfo.media.currentTime;
				break;
			case 'loadstart':
				break;
			case 'loadedmetadata':
				break;
			default:
				console.warn('%cUNKNOWN EVENT', 'color: red;', event.type, event);
				break;
		}

		state.hasSrc = !!audioInfo.media.src;
		audioInfo.state$$.next({ ...audioInfo.state$$.value, ...state });
		// console.log('%c_updateStateEvents', 'color: orange;', event.type, audioInfo.state$$.value);
	}

	/**
	 * Play a track from a virtual playlist using their ids
	 * @param virtualPlaylistId
	 * @param virtualTrackId
	 * @param fileIdx
	 * @param percentageOfFileToSeek
	 * @returns
	 */
	public seekTrackInVirtualPlaylist(
		virtualPlaylistId: string,
		virtualTrackId: string,
		fileIdx: number = 0,
		percentageOfFileToSeek: number = 0
	): void {
		if (debug)
			console.log('%cseekTrackInVirtualPlaylist', 'color: #00f; font-weight: bold;', virtualPlaylistId, virtualTrackId);

		const virtualPlaylist = this._virtualPlaylists$$Map.get(virtualPlaylistId)?.value;
		if (!virtualPlaylist) return;

		const track = virtualPlaylist.virtualTracks.find((track) => track.id === virtualTrackId);
		if (!track) return;
		if (track.files.length === 0) return;

		if (fileIdx >= track.files.length) return;

		const fileIdToPlay: string = track.files[fileIdx].fileId;

		const audioInfoKeyToSeek = this._getMediaInfoKey(virtualPlaylistId, virtualTrackId, fileIdToPlay);

		let targetReached = false;

		const virtualPlaylistState = this._virtualPlaylistStatesMap.get(virtualPlaylistId);
		const wasBeingPlayed = virtualPlaylistState?.representativeState?.playing ?? false;
		this.pausePlaylist(virtualPlaylistId);
		if (debug)
			console.log('%cseekTrackInVirtualPlaylist', 'color: #00f; font-weight: bold;', 'was being played:', wasBeingPlayed);

		for (let i = 0; i < virtualPlaylist.virtualTracks.length; i++) {
			const virtualTrack = virtualPlaylist.virtualTracks[i];
			for (let j = 0; j < virtualTrack.files.length; j++) {
				const fileId: string = virtualTrack.files[j].fileId;
				const mediaInfoKey = this._getMediaInfoKey(virtualPlaylistId, virtualTrack.id, fileId);
				const mediaInfo = this._mediasMap.get(mediaInfoKey);

				if (mediaInfoKey === audioInfoKeyToSeek) {
					targetReached = true;

					if (mediaInfo) {
						this.__setCurrentTime(mediaInfo.media, mediaInfo.media.duration * percentageOfFileToSeek);
						if (wasBeingPlayed) {
							// we paused to seek, but we were playing before so we launch playing again
							this.__playMedia(mediaInfo);
						} else {
							// we are not playing but seeking induces a new change of the image to draw
							this.__drawVideo(mediaInfo);
						}
					}
				} else if (targetReached) {
					if (mediaInfo) {
						mediaInfo.media.pause();
						this.__setCurrentTime(mediaInfo.media, 0);
					}
				} else {
					if (mediaInfo) {
						mediaInfo.media.pause();
						this.__setCurrentTime(mediaInfo.media, mediaInfo.media.duration);
					} else {
						// console.log(
						// 	'%cseekTrackInVirtualPlaylist',
						// 	'color: #0f0; font-weight: bold;',
						// 	i,
						// 	j,
						// 	'seeking',
						// 	audioInfoKey,
						// 	'audioInfo not found'
						// );
					}
				}
			}
		}
	}

	/**
	 * Can be called to update positions of seekbar
	 * @param virtualPlaylistId
	 * @returns
	 */
	public updatePositions(virtualPlaylistId: string): void {
		//console.log('%cseekTrackInVirtualPlaylist', 'color: #00f; font-weight: bold;', virtualPlaylistId, virtualTrackId);

		const virtualPlaylist = this._virtualPlaylists$$Map.get(virtualPlaylistId)?.value;
		if (!virtualPlaylist) return;

		let targetReached = false;

		const virtualPlaylistState = this._virtualPlaylistStatesMap.get(virtualPlaylistId);
		const isBeingPlayed = virtualPlaylistState?.representativeState?.playing ?? false;

		if (isBeingPlayed) return;

		const indexOfTrackBeingPlayed = virtualPlaylistState?.representativeState?.lastIndexBeingPlayed ?? 0;
		let indexOfFileBeingPlayed = 0;
		if (indexOfTrackBeingPlayed >= 0) {
			indexOfFileBeingPlayed =
				virtualPlaylistState?.virtualTrackWithStreamStates?.[indexOfTrackBeingPlayed]?.representativeState
					?.lastIndexBeingPlayed ?? 0;
		}
		const audioInfoKeyToSeek = this._getMediaInfoKey(
			virtualPlaylistId,
			virtualPlaylist.virtualTracks[indexOfTrackBeingPlayed].id,
			virtualPlaylist.virtualTracks[indexOfTrackBeingPlayed].files[indexOfFileBeingPlayed].fileId
		);

		//console.log('%cseekTrackInVirtualPlaylist', 'color: #00f; font-weight: bold;', 'was being played:', wasBeingPlayed);

		for (let i = 0; i < virtualPlaylist.virtualTracks.length; i++) {
			const virtualTrack = virtualPlaylist.virtualTracks[i];
			for (let j = 0; j < virtualTrack.files.length; j++) {
				const fileId: string = virtualTrack.files[j].fileId;
				const audioInfoKey = this._getMediaInfoKey(virtualPlaylistId, virtualTrack.id, fileId);
				const audioInfo = this._mediasMap.get(audioInfoKey);

				if (audioInfoKey === audioInfoKeyToSeek) {
					targetReached = true;

					// if (audioInfo) {
					// 	this.__setCurrentTime(audioInfo.audio, audioInfo.audio.duration * percentageOfFileToSeek);
					// }
				} else if (targetReached) {
					if (audioInfo) {
						audioInfo.media.pause();
						this.__setCurrentTime(audioInfo.media, 0);
					}
				} else {
					if (audioInfo) {
						audioInfo.media.pause();
						this.__setCurrentTime(audioInfo.media, audioInfo.media.duration);
					} else {
						// console.log(
						// 	'%cseekTrackInVirtualPlaylist',
						// 	'color: #0f0; font-weight: bold;',
						// 	i,
						// 	j,
						// 	'seeking',
						// 	audioInfoKey,
						// 	'audioInfo not found'
						// );
					}
				}
			}
		}
	}

	/**
	 * Play a track from a virtual playlist using its index
	 * @param virtualPlaylistId
	 * @param virtualTrackIdx
	 * @param fileIdx
	 * @param percentageOfFileToSeek
	 * @returns
	 */
	public seekTrackByIndex(
		virtualPlaylistId: string,
		virtualTrackIdx: number,
		fileIdx: number = 0,
		percentageOfFileToSeek: number = 0
	): void {
		//console.log('%cseekTrackByIndex', 'color: #00f; font-weight: bold;', virtualPlaylistId, virtualTrackIdx);

		const virtualPlaylist$$ = this._virtualPlaylists$$Map.get(virtualPlaylistId);
		if (!virtualPlaylist$$) return;

		const track = virtualPlaylist$$.value?.virtualTracks[virtualTrackIdx];
		if (!track) return;

		this.seekTrackInVirtualPlaylist(virtualPlaylistId, track.id, fileIdx, percentageOfFileToSeek);
	}

	/**
	 * Generally used when seeking on a virtual playlist (one level up) (computes the relative percentage of the file in the track to play from the global playbar)
	 * @param virtualPlaylistId
	 * @param virtualTrackIdx
	 * @param percentageOfTrackToSeek
	 * @returns
	 */
	public seekTrackAtPercentage(virtualPlaylistId: string, virtualTrackIdx: number, percentageOfTrackToSeek: number) {
		const virtualPlaylist$$ = this._virtualPlaylists$$Map.get(virtualPlaylistId);
		if (!virtualPlaylist$$) return;
		const virtualPlaylist = virtualPlaylist$$.value;
		if (!virtualPlaylist) return;
		if (virtualPlaylist.virtualTracks.length === 0) return;

		const virtualPlaylistState = this._virtualPlaylistStatesMap.get(virtualPlaylistId);
		if (!virtualPlaylistState) return;

		if (!virtualPlaylistState.virtualTrackWithStreamStates) return;

		const virtualTrackWithStreamState = virtualPlaylistState.virtualTrackWithStreamStates[virtualTrackIdx];
		if (!virtualTrackWithStreamState) return;

		const virtualTrackRepresentativeState = virtualTrackWithStreamState.representativeState;

		// get index via percentage on track
		const fileIndexToPlay = virtualTrackRepresentativeState.cumulatedDurations.findIndex(
			(d) => d > percentageOfTrackToSeek
		);
		if (fileIndexToPlay === -1) return;

		let cumulatedDurationBeforeThisFile = 0;
		let durationOfTheFileToBePlayed = 0;

		if (fileIndexToPlay > 0) {
			cumulatedDurationBeforeThisFile = virtualTrackRepresentativeState.cumulatedDurations[fileIndexToPlay - 1];
			durationOfTheFileToBePlayed =
				virtualTrackRepresentativeState.cumulatedDurations[fileIndexToPlay] -
				virtualTrackRepresentativeState.cumulatedDurations[fileIndexToPlay - 1];
		} else if (fileIndexToPlay === 0) {
			cumulatedDurationBeforeThisFile = 0;
			durationOfTheFileToBePlayed = virtualTrackRepresentativeState.cumulatedDurations[fileIndexToPlay];
		}
		const cumulatedDurationLeftOfThisFile = percentageOfTrackToSeek - cumulatedDurationBeforeThisFile;

		if (durationOfTheFileToBePlayed <= 0) return;

		const percentageOfFileToSeek = cumulatedDurationLeftOfThisFile / durationOfTheFileToBePlayed;

		this.seekTrackByIndex(virtualPlaylistId, virtualTrackIdx, fileIndexToPlay, percentageOfFileToSeek);
	}

	public resumePlaylist(virtualPlaylistId: string, onlyActive = true): void {
		//console.log('%cresumePlaylist', 'color: #00f; font-weight: bold;', virtualPlaylistId);
		const virtualPlaylist$$ = this._virtualPlaylists$$Map.get(virtualPlaylistId);
		if (!virtualPlaylist$$) return;
		const virtualPlaylist = virtualPlaylist$$.value;
		if (!virtualPlaylist) return;
		if (virtualPlaylist.virtualTracks.length === 0) return;
		const virtualPlaylistState = this._virtualPlaylistStatesMap.get(virtualPlaylistId);
		if (!virtualPlaylistState) return;

		// already being played
		if (virtualPlaylistState.representativeState.playing) return;

		if (!virtualPlaylistState.virtualTrackWithStreamStates) return;

		let resetFileIndex = false;
		// last index with a positive currentTime
		let currentTrackIndex = findLastIndex(
			virtualPlaylistState.virtualTrackWithStreamStates,
			(streamState) => (streamState.representativeState.cumulatedPlayedDuration ?? 0) > 0
		);
		// first index with an active track
		if (currentTrackIndex === -1 && onlyActive) {
			currentTrackIndex = findIndex(
				virtualPlaylistState.virtualTrackWithStreamStates,
				(streamState) => streamState.virtualTrack.active ?? false
			);
			resetFileIndex = true;
		}
		// first index with a positive duration
		if (currentTrackIndex === -1 && !onlyActive) {
			currentTrackIndex = findIndex(
				virtualPlaylistState.virtualTrackWithStreamStates,
				(streamState) => streamState.representativeState.duration > 0 ?? false
			);
			resetFileIndex = true;
		}
		if (currentTrackIndex === -1) {
			console.warn('%cresumePlaylist', 'color: #f00; font-weight: bold;', virtualPlaylistId, 'no track to play');
			return;
		}

		// if nothing found yet, use the first one
		if (currentTrackIndex === -1) {
			currentTrackIndex = 0;
			resetFileIndex = true;
		}

		// console.log('%cresumePlaylist', 'color: #00f; font-weight: bold;', currentTrackIndex, resetFileIndex);

		// let currentTrackIndex = virtualPlaylistState.representativeState.lastIndexBeingPlayed;

		// if (
		// 	virtualPlaylistState.representativeState.cumulatedPlayedDuration ===
		// 		virtualPlaylistState.representativeState.duration &&
		// 	!ignoreActiveStatus
		// ) {
		// 	console.log('%cresumePlaylist', 'color: #00f; font-weight: bold;', virtualPlaylistId, 'end of playlist');
		// 	currentTrackIndex = virtualPlaylistState.virtualPlaylist.virtualTracks.findIndex((t) => t.active);
		// 	if (currentTrackIndex === -1) currentTrackIndex = 0;
		// 	// return this.resumePlaylist(virtualPlaylistId);
		// 	// return;
		// }

		if (
			virtualPlaylistState.virtualTrackWithStreamStates[currentTrackIndex].representativeState.cumulatedPlayedDuration ===
				virtualPlaylistState.virtualTrackWithStreamStates[currentTrackIndex].representativeState.duration &&
			onlyActive
		) {
			// console.log('%cresumePlaylist', 'color: #00f; font-weight: bold;', virtualPlaylistId, 'end of track');

			// next active track
			while (currentTrackIndex < virtualPlaylistState.virtualTrackWithStreamStates.length) {
				currentTrackIndex++;
				currentTrackIndex = currentTrackIndex % virtualPlaylistState.virtualTrackWithStreamStates.length;
				if (virtualPlaylistState.virtualTrackWithStreamStates[currentTrackIndex].virtualTrack.active ?? false) {
					break;
				}
			}

			// currentTrackIndex = virtualPlaylistState.virtualPlaylist.virtualTracks.findIndex((t) => t.active);
			// if (currentTrackIndex === -1) currentTrackIndex = 0;
			// // return this.resumePlaylist(virtualPlaylistId);
			// // return;
		}

		const virtualTrackId = virtualPlaylist.virtualTracks[currentTrackIndex].id;

		const currentFileIndex =
			virtualPlaylistState.virtualTrackWithStreamStates[currentTrackIndex].representativeState.lastIndexBeingPlayed;
		const currentFileId: string = virtualPlaylist.virtualTracks[currentTrackIndex].files[currentFileIndex].fileId;

		// we have a playlist, a track and a file
		// we just need to play this file

		const audioInfoKey = this._getMediaInfoKey(virtualPlaylistId, virtualTrackId, currentFileId);
		const audioInfo = this._mediasMap.get(audioInfoKey);

		// console.log(
		// 	'%cresumePlaylist',
		// 	'color: #00f; font-weight: bold;',
		// 	virtualPlaylistId,
		// 	virtualTrackId,
		// 	currentFileId,
		// 	audioInfoKey,
		// 	audioInfo,
		// 	virtualPlaylistState
		// );

		if (!audioInfo) return;
		this.__playMedia(audioInfo);
	}

	/**
	 * Automate next action when an `Audio` ends
	 * @param audioInfoKey
	 * @returns
	 */
	private _playNext(audioInfoKey: string, forcePlaying = false): void {
		// console.log('%c_playNext', 'color: #0fd; font-weight: bold;', forcePlaying);

		const audioInfo = this._mediasMap.get(audioInfoKey);
		if (!audioInfo) return;
		const virtualPlaylist$$ = this._virtualPlaylists$$Map.get(audioInfo.virtualPlaylistId);
		if (!virtualPlaylist$$) return;
		const virtualPlaylist = virtualPlaylist$$.value;
		if (!virtualPlaylist) return;

		const trackIndex = virtualPlaylist.virtualTracks.findIndex(
			(virtualTrack) => virtualTrack.id === audioInfo.virtualTrackId
		);
		if (trackIndex === -1) return;
		const virtualTrack = virtualPlaylist.virtualTracks[trackIndex];

		const playlistState = this._virtualPlaylistStatesMap.get(audioInfo.virtualPlaylistId);
		let virtualTrackState: null | VirtualTrackWithStreamStates = null;
		if (playlistState) {
			const streamStates = playlistState.virtualTrackWithStreamStates;
			if (streamStates) {
				virtualTrackState = streamStates[trackIndex];
			}
		}
		const fileIndexInTrack: number = virtualTrack.files.map((file) => file.fileId).indexOf(audioInfo.fileId);
		if (fileIndexInTrack === -1) return;

		const isLastFileInTrack: boolean = fileIndexInTrack === virtualTrack.files.length - 1;
		const isFirstFileInTrack: boolean = fileIndexInTrack === 0;

		let nextAudioInfoKey: string | undefined = undefined;

		if (!isLastFileInTrack) {
			// not last file => play next file
			const nextFileId: string = virtualTrack.files[fileIndexInTrack + 1].fileId;
			nextAudioInfoKey = this._getMediaInfoKey(audioInfo.virtualPlaylistId, virtualTrack.id, nextFileId);
		} else {
			// last file
			const isLastTrack = trackIndex === virtualPlaylist.virtualTracks.length - 1;
			if (isLastTrack) {
				// last track
				//console.log('%clast track and last file in track', 'color: #00f; font-weight: bold;', audioInfoKey);
			} else {
				// not last track => play next track

				const nextTrackId: string = virtualPlaylist.virtualTracks[trackIndex + 1].id;
				const nextFileId: string = virtualPlaylist.virtualTracks[trackIndex + 1].files[0].fileId;
				nextAudioInfoKey = this._getMediaInfoKey(audioInfo.virtualPlaylistId, nextTrackId, nextFileId);
			}
		}

		if (nextAudioInfoKey) {
			const nextAudioInfo = this._mediasMap.get(nextAudioInfoKey);
			if (!nextAudioInfo) return;
			const nextVirtualTrack = virtualPlaylist.virtualTracks.find((track) => track.id === nextAudioInfo.virtualTrackId);
			if (!nextVirtualTrack) return;
			if (!nextVirtualTrack.active && nextVirtualTrack.id != virtualTrack.id) {
				this._playNext(nextAudioInfoKey, forcePlaying);
				return;
			}
			if (
				!nextVirtualTrack.active &&
				nextVirtualTrack.id == virtualTrack.id &&
				(virtualTrackState?.representativeState?.cumulatedPlayedDuration ?? 0) == 0
			) {
				this._playNext(nextAudioInfoKey, forcePlaying);
				return;
			}

			this.__playMedia(nextAudioInfo);
		}
	}

	public pausePlaylist(virtualPlaylistId: string, resetCurrentTimes: boolean = false): void {
		//console.log('%cpausePlaylist', 'color: #00f; font-weight: bold;', virtualPlaylistId);

		const virtualPlaylist$$ = this._virtualPlaylists$$Map.get(virtualPlaylistId);
		if (!virtualPlaylist$$) return;
		const virtualPlaylist = virtualPlaylist$$.value;
		if (!virtualPlaylist) return;

		virtualPlaylist.virtualTracks.forEach((track) => {
			track.files.forEach((file) => {
				const audioInfoKey = this._getMediaInfoKey(virtualPlaylistId, track.id, file.fileId);
				const audioInfo = this._mediasMap.get(audioInfoKey);
				if (!audioInfo) return;
				audioInfo.media.pause();
				if (resetCurrentTimes) {
					// audioInfo.audio.currentTime = CURRENTTIME_RESET;
					this.__setCurrentTime(audioInfo.media, CURRENTTIME_RESET);
					audioInfo.state$$.next({ ...audioInfo.state$$.value, currentTime: CURRENTTIME_RESET });
				}
			});
		});
	}

	public pauseAllPlaylists(resetCurrentTimes: boolean = false) {
		for (const virtualPlaylistId of this._virtualPlaylists$$Map.keys()) {
			this.pausePlaylist(virtualPlaylistId, resetCurrentTimes);
		}
	}

	private _logMapsState() {
		console.log('%clogMapsState', 'color: #00f; font-weight: bold;');
		console.log('%c_virtualPlaylists$$Map', 'color: #00f; font-weight: bold;', this._virtualPlaylists$$Map);
		console.log('%c_virtualPlaylistStates$$Map', 'color: #00f; font-weight: bold;', this._virtualPlaylistStates$Map);
		console.log('%c_audiosMap', 'color: #00f; font-weight: bold;', this._mediasMap);
	}

	private __playMedia(mediaInfo: MediaInfo) {
		const media = mediaInfo.media;
		if (media.error) {
			console.warn('%c_playMedia', 'color: #f00; font-weight: bold;', media.error);
			return;
		}
		if (!media.src) {
			console.warn('%c_playMedia', 'color: #f00; font-weight: bold;', 'no src');
			return;
		}
		if (!media.paused) {
			if (debug) console.log('%c_playMedia', 'color: #f00; font-weight: bold;', 'already playing');
			return;
		}

		if (debug) console.log('%c_playMedia', 'color: #00f; font-weight: bold;', mediaInfo);

		media.play();

		if (media.nodeName.toLowerCase() === 'video') {
			this.__drawVideo(mediaInfo);
		}
	}

	private __setCurrentTime(audio: HTMLAudioElement | HTMLVideoElement, currentTime: number) {
		if (audio.error) {
			console.warn('%c_setCurrentTime', 'color: #f00; font-weight: bold;', audio.error);
			return;
		}
		if (!audio.src) {
			console.warn('%c_setCurrentTime', 'color: #f00; font-weight: bold;', 'no src');
			return;
		}
		if (!Number.isFinite(currentTime)) {
			console.warn('%c_setCurrentTime', 'color: #f00; font-weight: bold;', 'currentTime is not finite');
			return;
		}
		audio.currentTime = currentTime;
	}

	public registerVideoPreview(playlistIdentifier: string, canvas?: HTMLCanvasElement) {
		if (debug) console.log({ playlistIdentifier, canva: canvas });
		this._virtualPlaylistCanvasMap.set(playlistIdentifier, canvas ?? null);
		this.__drawVideoForPlaylist(playlistIdentifier);
	}

	private __drawVideoForPlaylist(playlistIdentifier: string) {
		const canvas = this._virtualPlaylistCanvasMap.get(playlistIdentifier);
		if (canvas) {
			const a: VirtualPlaylistWithStreamStates | null | undefined =
				this._virtualPlaylistStatesMap.get(playlistIdentifier);
			const b: VirtualTrackWithStreamStates[] | undefined = a?.virtualTrackWithStreamStates;
			if (a && b && b.length > 0) {
				const lastIndexBeingPlayed = a.representativeState.lastIndexBeingPlayed;
				const c = b[lastIndexBeingPlayed];
				if (c.virtualTrack.files.length > 0) {
					const fileId: string = c.virtualTrack.files[0].fileId;
					const mediaInfoKey = this._getMediaInfoKey(playlistIdentifier, c.virtualTrack.id, fileId);
					const mediaInfo = this._mediasMap.get(mediaInfoKey);
					if (mediaInfo) this.__drawVideo(mediaInfo);
				}
			}
		}
	}

	private __drawVideo(mediaInfo: MediaInfo) {
		// https://stackoverflow.com/questions/24496605/how-can-i-show-the-same-html-5-video-twice-on-a-website-without-loading-it-twice

		const canvas = this._virtualPlaylistCanvasMap.get(mediaInfo.virtualPlaylistId);
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;

		const context = canvas.getContext('2d');

		if (mediaInfo.mediaType === 'video') {
			const video = mediaInfo.media as HTMLVideoElement;

			const videoElement = video;

			const maxWidthToUse = Math.min(canvas.clientWidth, parent.clientWidth);
			const maxHeightToUse = parent.nodeName.toLowerCase() == 'body' ? parent.clientHeight : 500;
			let widthToUse = maxWidthToUse;
			let heightToUse = maxHeightToUse;
			let widthRatio = 1;
			let heightRatio = 1;
			if (videoElement.videoWidth > 0 && maxWidthToUse > 0) widthRatio = maxWidthToUse / videoElement.videoWidth;
			if (videoElement.videoHeight > 0 && maxHeightToUse > 0) heightRatio = maxHeightToUse / videoElement.videoHeight;

			const ratio = Math.min(widthRatio, heightRatio);

			widthToUse = videoElement.videoWidth * ratio;
			heightToUse = videoElement.videoHeight * ratio;

			canvas.style.height = heightToUse + 'px';
			canvas.style.width = widthToUse + 'px';
			canvas.width = widthToUse;
			canvas.height = heightToUse;

			if (parent.nodeName.toLowerCase() != 'body') {
				// update parent height (0 by default)
				parent.style.height = heightToUse + 'px'; //hratio + 'px';
			}

			context?.drawImage(video, 0, 0, widthToUse, heightToUse);

			const updateBigVideo = () => {
				context?.drawImage(video, 0, 0, widthToUse, heightToUse);
				if (video.paused || video.ended) {
					return;
				}
				setTimeout(() => {
					updateBigVideo();
				}, 1000 / 30);
			};
			updateBigVideo();
		} else {
			if (context) {
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.fillStyle = 'rgba(255, 255, 255, 0.1)';
				context.fillRect(0, 0, canvas.width, canvas.height);
				context.font = '18px serif';
				context.fillText('audio only', 20, 20);
			}
		}
	}

	// private __drawFirstFrame(playlistId: string) {}
}
