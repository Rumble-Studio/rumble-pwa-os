import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BrokerService, BROKE_OPTIONS } from '@rumble-pwa/broker-system';
import { MetaHowl, Song } from '@rumble-pwa/mega-store';
import { StorageService } from '@rumble-pwa/storage';
import { getRouteQueryParam$, updateInPlace } from '@rumble-pwa/utils';
import { Howl } from 'howler';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const __ALREADY_PRELOADED_SONGS = '__ALREADY_PRELOADED_SONGS';
const __REFRESH_INTERVAL = 100;
@UntilDestroy()
@Injectable()
export class PlayerService implements OnDestroy {
	private _debug = false;
	songsPreloaded = false;

	metaHowlMap = new Map<string, MetaHowl>();

	autoStartNextSong = true;
	autoLoopOnSonglist = false;
	autoPreloadSongs = false; // => exhaust html5 audio pool

	index$$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	index$ = this.index$$.asObservable();
	private _index = 0;
	get index() {
		return this._index;
	}
	set index(newIndex: number) {
		if (newIndex == this._index) return;
		this._index = newIndex;
		this.index$$.next(this._index);
	}

	songlist$$: BehaviorSubject<Song[]> = new BehaviorSubject<Song[]>([]);
	songlist$ = this.songlist$$.asObservable();
	private _songlist: Song[] = [];
	get songlist() {
		return this._songlist;
	}
	set songlist(newSonglist) {
		this.stop(); // stop before doing anything else

		let updateIndex = false;
		if (this._songlist.length != newSonglist.length) updateIndex = true;
		updateInPlace(
			this._songlist,
			newSonglist,
			[
				// 'howl',
				// 'loaded',
				// 'valid',
				// 'duration',
				// 'position',
				// 'percentage',
				'toSync',
				'operation',
				'rank',
				'timeUpdate',
				'songTitle',
			]
			// 'songlist$$'
		);
		if (updateIndex) this.index = 0;
		if (this.autoPreloadSongs) this.preloadSongs();
		this.songlist$$.next(this._songlist);
		if (this._debug) console.log('Song list changed:', this._songlist);
	}

	playing$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	playing$ = this.playing$$.asObservable();

	position$$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	position$ = this.position$$.asObservable();
	percentage$$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	percentage$ = this.percentage$$.asObservable();

	totalDuration$$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	totalDuration$ = this.totalDuration$$.asObservable();

	lastSongPlayed$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	lastSongPlayed$ = this.lastSongPlayed$$.asObservable();

	ticInterval;
	private _uniqueId?: string | undefined;
	public get uniqueId() {
		return this._uniqueId;
	}
	public set uniqueId(value) {
		this._uniqueId = value;
		if (this._debug) console.log('%c[playerService]', 'color:green', this.uniqueId);
	}

	playerId = uuidv4();

	constructor(
		private brokerService: BrokerService,
		private storageService: StorageService,
		private activatedRoute: ActivatedRoute
	) {
		const canPreload = !!(this.storageService.cache[__ALREADY_PRELOADED_SONGS] ?? false);
		if (canPreload) {
			this.autoPreloadSongs = true;
		}
		if (this._debug) console.log('%c[playerService]', 'color:green', this.playerId, this.autoPreloadSongs);

		this.ticInterval = setInterval(() => {
			this._updateAllHowlPosition();
		}, __REFRESH_INTERVAL);

		this.brokerService.broker$
			.pipe(
				untilDestroyed(this),
				tap((message) => {
					if (message === BROKE_OPTIONS.stopPlaying) {
						this.stop();
					} else if (message === BROKE_OPTIONS.preloadSongs) {
						if (!this.songsPreloaded) {
							this.preloadSongs();
						}
						this.songsPreloaded = true;
						this.storageService.cache[__ALREADY_PRELOADED_SONGS] = true;
					} else if (message.startsWith(BROKE_OPTIONS.stopPlaying + ':!')) {
						const playerId = message.split(':!')[1];
						if (playerId !== this.playerId) {
							this.stop();
						}
					}
				})
			)
			.subscribe();

		getRouteQueryParam$(this.activatedRoute, 'debug')
			.pipe(
				untilDestroyed(this),
				tap((debug) => {
					this._debug = !!debug;
				})
			)
			.subscribe();
	}

	ngOnDestroy() {
		this.stop();
		clearInterval(this.ticInterval);
		if (this._debug) console.log('%c[playerService](ngOnDestroy)', 'color:maroon', this.uniqueId);
	}

	private _indexToUse(index: number | null, onlyActive = true) {
		let _indexToUse = 0;

		// if we are already playing an index we start with that
		if (this.index !== null) _indexToUse = this.index;

		// if request on onlyActive we check the current index
		if (this.songlist[_indexToUse].inactive && onlyActive) _indexToUse = this.songlist.findIndex((song) => !song.inactive);

		// if an index is given, we only check playlist borders
		if (index !== null && index > -1 && index < this.songlist.length) {
			_indexToUse = index;
		}
		return _indexToUse;
	}

	playPerSongId(songId: string, stopOthers = true, onlyActive = false) {
		const indexToPlay = this.songlist.findIndex((song) => song.id === songId);
		this.play(indexToPlay, stopOthers, null, onlyActive);
	}

	play(index: number | null = null, stopOthers = true, percentageToSeek: number | null = null, onlyActive = true) {
		if (this.songlist.length === 0) return;

		const indexToPlay = this._indexToUse(index, onlyActive);

		// if only non active songs are available we do not play them.
		if (indexToPlay < 0) return;
		this.index = indexToPlay;

		// Check howl instance to play
		const song = this.songlist[indexToPlay];
		if (this._debug)
			console.log(
				'%c[playerService]',
				'color:green',
				'play',
				indexToPlay,
				song.fileSrc
					? song.fileSrc.substring(0, 10) + '...' + song.fileSrc.substring(song.fileSrc.length - 10)
					: '<no fileSrc>',
				{ song }
			);

		if (stopOthers) {
			this.songlist.forEach((otherSong: Song) => {
				if (song.id != otherSong.id) this._stopHowl(otherSong.id);
			});
			// this.updateAllSongPosition();
		}

		if (percentageToSeek) this.seekPerPercentage(percentageToSeek);

		// Check if howl is already playing
		if (!this._isHowlPlaying(song.id)) {
			const startedPlaying = this._playHowl(song.id);

			this.preloadSongs();

			// the asked file can't be played so playing next
			if (!startedPlaying && this.autoStartNextSong) this.next(true);
		}
	}

	seekPerPercentage(percentage: number, index: number | null = null) {
		if (this.songlist.length === 0) return;

		if (this._debug) console.log('(seekPerPercentage)', percentage, index);

		const indexToSeek = this._indexToUse(index);
		const song = this.songlist[indexToSeek];

		const duration = this._getHowlDuration(song.id);

		if (duration === Infinity) {
			if (this._debug) console.warn('Seeking a song with INFINITY duration');
			this._seekHowl(0, song.id);
			return;
		}

		if (duration <= 0) {
			if (this._debug) console.warn('Seeking a song with INCORRECT duration', duration);
			this._seekHowl(0, song.id);
			return;
		}

		const position = percentage * duration;
		this._seekHowl(position, song.id);
	}

	seekPerPosition(position: number, index: number | null = null): void {
		if (this.songlist.length === 0) return;

		const indexToSeek = this._indexToUse(index);
		const song = this.songlist[indexToSeek];
		this._seekHowl(position, song.id);
	}

	pause(index: number | null = null, pauseAll = false): void {
		if (this.songlist.length === 0) return;
		if (pauseAll) {
			this.songlist.forEach((song: Song) => {
				this._pauseHowl(song.id);
				// if (song.howl && song.valid) {
				//   song.howl.pause();
				// }
			});
			return;
		}

		const indexToPause = this._indexToUse(index, false);
		const song = this.songlist[indexToPause];
		this._pauseHowl(song.id);
		// if (song.howl && song.valid) {
		//   song.howl.pause();
		// }
	}

	stop(index: number | null = null, stopAll = false): void {
		if (this.songlist.length === 0) return;
		if (stopAll) {
			this.songlist.forEach((song: Song) => {
				this._stopHowl(song.id);
				// if (song.howl && song.valid) {
				//   song.howl.stop();
				// }
			});
			// this.updateAllSongPosition();
			return;
		}

		const indexToStop = this._indexToUse(index, false);
		const song = this.songlist[indexToStop];
		this._stopHowl(song.id);
		// if (song.howl && song.valid) {
		//   song.howl.stop();
		//   this.updateAllSongPosition();
		// }
	}

	next(playNextSong = false): void {
		if (this.songlist.length === 0) return;
		// remember playing state before stopping
		const currentSong = this.songlist[this.index];
		const wasPlaying = this._isHowlPlaying(currentSong.id);

		this.stop();

		if (this.songlist[this.index].inactive) {
			if (this._debug) console.warn('No next on inactive song.');
			return;
		}

		// if no other song is valid we stop
		if (!this.songlist.some((s) => !!this.metaHowlMap.get(s.id)?.valid && !s.inactive)) {
			if (this._debug) console.warn("Can't do next: no file valid or active.", JSON.stringify(this.songlist));
			return;
		}

		if (this.index + 1 >= this.songlist.length) {
			this.index = 0;
			if (this._debug) console.log('End of playlist');
			// if last song and not autoLoopOnSonglist we stop here
			if (!this.autoLoopOnSonglist) return;
		} else {
			this.index += 1;
		}

		if (this._debug) console.log('(next) new index:', this.index);

		// Check that next song is valid or go to next one
		const newSong = this.songlist[this.index];

		if (!this.metaHowlMap.get(newSong.id)?.valid || newSong.inactive) {
			this.next(wasPlaying || playNextSong);
			return;
		}
		if (wasPlaying || playNextSong) {
			this.play();
		}
	}

	prev(playPrevSong = false): void {
		if (this.songlist.length === 0) return;

		const currentSong = this.songlist[this.index];
		const currentMetaHowl = this.metaHowlMap.get(currentSong.id);
		if (currentMetaHowl?.valid && !currentSong.inactive) {
			if (currentMetaHowl.position > 2) {
				this.seekPerPosition(0);
				return;
			}
		}

		// remember playing state before stopping
		const wasPlaying = this._isHowlPlaying(currentSong.id);

		this.stop();
		// if no other song is valid we stop
		if (!this.songlist.some((s) => !!this.metaHowlMap.get(s.id)?.valid && !s.inactive)) {
			if (this._debug) console.warn("Can't do prev: no file valid or active.");
			return;
		}

		if (this.index - 1 < 0) {
			this.index = this.songlist.length - 1;
		} else {
			this.index -= 1;
		}

		if (this._debug) console.log('(prev) new index:', this.index);
		// Check that prev song is valid or go to next one
		const newSong = this.songlist[this.index];
		if (!this.metaHowlMap.get(newSong.id)?.valid || newSong.inactive) {
			this.prev(wasPlaying || playPrevSong);
			return;
		}
		if (wasPlaying || playPrevSong) {
			this.play();
		}
	}

	preloadSongs() {
		if (this._debug) console.log('(preloadSongs) Preloading songs...');
		this.songlist.forEach((song) => {
			const metaHowl = this.metaHowlMap.get(song.id);
			if (!metaHowl) {
				if (this._debug) console.warn('(preloadSongs) No metaHowl yet for song:', song.id);
				this._getMetaHowl(song.id);
			} else {
				if (this._debug) console.log('(preloadSongs) Already have a metaHowl:', song.id, metaHowl.valid);
			}

			// update if local to server
			if (metaHowl && metaHowl.origin === 'local' && song.fileSrc?.startsWith('http')) this._getMetaHowl(song.id, true);
			// update if not mp3 to mp3
			else if (metaHowl && metaHowl.mp3 === false && song.fileSrc?.includes('.mp3')) this._getMetaHowl(song.id, true);
			// update if not valid yet
			else if (metaHowl && !metaHowl.valid) this._getMetaHowl(song.id, true);
		});
		this._updateAllHowlPosition(true);
	}

	/**
	 * Returns the index of a given song in the songlist*/
	getSongIndex(song: { id: string }): number {
		return this.songlist.map((s) => s.id).indexOf(song.id);
	}

	/** Load a songlist from Partial Song object */
	setSonglistFromSongObjects(songs: Partial<Song>[]) {
		if (this._debug) console.log('(setSonglistFromSongObjects)', songs);
		this.songlist = songs.map((songData, index) => {
			const song: Song = {
				songTitle: 'Song ' + index,
				// fileSrc: '',
				// howl: null,
				id: uuidv4(),
				// duration: 0,
				// loaded: false,
				// valid: false,
				// position: 0,
				// percentage: 0,
				...songData,
			};
			return song;
		});
	}

	private _getMetaHowl(songId: string, refreshHowl = false): MetaHowl | undefined {
		if (this._debug) console.log('(_getMetaHowl)', songId);
		if (this.metaHowlMap.has(songId) && !refreshHowl) {
			return this.metaHowlMap.get(songId);
		}

		const song = this._getSongPerId(songId);
		if (!song) {
			if (this._debug) console.warn('(_getMetaHowl)', 'Asking for a meta howl without the song in songlist.');
			return undefined;
		}

		const metaHowl: MetaHowl = {
			howl: null,
			duration: -1,
			loaded: false,
			percentage: -1,
			position: -1,
			valid: true,
			origin: song.fileSrc ? (song.fileSrc.startsWith('http') ? 'server' : 'local') : 'unknown',
			mp3: song.fileSrc?.includes('.mp3') ?? false,
		};

		this.metaHowlMap.set(songId, metaHowl);

		// Extract the file extension from the URL or base64 data URI.
		let ext = song.fileSrc ? /^data:audio\/([^;,]+);/i.exec(song.fileSrc) : undefined;
		if (!ext && song.fileSrc) {
			ext = /\.([^.]+)$/.exec(song.fileSrc.split('?', 1)[0]);
		}
		if (this._debug)
			console.log(
				song.fileSrc
					? song.fileSrc.substring(0, 10) + '...' + song.fileSrc.substring(song.fileSrc.length - 10)
					: '<no fileSrc>',
				'Ext:',
				ext
			);

		const extLowerCase: string = ext ? ext[1].toString().toLowerCase() : '';
		if (!extLowerCase) {
			// howler library can't manage file without extension
			if (this._debug)
				console.warn('(_getMetaHowl)', 'This file does not have an extension and will be ignored by the player', ext);

			metaHowl.valid = false;
			metaHowl.loaded = false;
			return metaHowl;
		} else {
			if (this._debug)
				console.log('(_getMetaHowl)', 'This file has an extension and will be loaded by the player', extLowerCase);
		}
		if (this._debug) console.log('%c(_getMetaHowl) CREATING HOWL', 'color:goldenrod', song);
		const howl = new Howl({
			src: song.fileSrc ? [song.fileSrc] : [],
			html5: true,
			onplayerror: (error) => {
				console.error('An error occured while playing a song.', {
					song: { ...song },
					error,
				});
				metaHowl.valid = false;
				metaHowl.loaded = false;
			},
			onload: () => {
				if (this._debug) console.log('(_getMetaHowl)', 'Howl loaded', song);
				metaHowl.valid = true;
				metaHowl.loaded = true;
				metaHowl.position = 0;
				metaHowl.percentage = 0;
				this._getHowlDuration(songId, true);
				// this.updateSongDuration(song);
				// const songIndex = this.getSongIndex(song);
				// if (songIndex == this.index && this.autoStartPlayer) {
				//   this.play(songIndex);
				// }
			},
			onloaderror: (soundId: number, error: unknown) => {
				console.error('(_getMetaHowl)', 'An error occured while loading a song.', {
					song: { ...song },
					soundId,
					error,
				});
				metaHowl.valid = false;
				metaHowl.loaded = false;
			},
			onend: () => {
				if (this.autoStartNextSong) {
					if (this.index === this.songlist.length - 1) {
						this.lastSongPlayed$$.next(true);
					}
					this.next(true);
					return;
				}

				this.stop();
			},
			onpause: () => {
				//
			},
			onplay: () => {
				//
			},
			onseek: () => {
				//
			},
		});

		metaHowl.howl = howl;

		// console.log({ metaHowl });
		return metaHowl;
	}
	private _getSongPerId(songId: string): Song | undefined {
		return this.songlist.find((song) => song.id === songId);
	}
	private _isHowlPlaying(songId: string) {
		const metaHowl = this.metaHowlMap.get(songId);
		if (metaHowl) {
			if (metaHowl.valid) {
				return !!metaHowl.howl?.playing();
			}
		}
		return false;
	}
	private _stopHowl(songId: string) {
		const metaHowl = this.metaHowlMap.get(songId);
		if (metaHowl) {
			if (metaHowl.valid) {
				metaHowl.howl?.stop();
				this._updateHowlPosition(songId);
			}
		}
	}
	private _playHowl(songId: string) {
		let metaHowl = this.metaHowlMap.get(songId);

		if (!metaHowl) this._getMetaHowl(songId);

		metaHowl = this.metaHowlMap.get(songId);

		if (metaHowl) {
			if (metaHowl.valid) {
				metaHowl.howl?.play();
				return true;
			}
		}
		return false;
	}
	private _pauseHowl(songId: string) {
		const metaHowl = this.metaHowlMap.get(songId);
		if (metaHowl) {
			if (metaHowl.valid) {
				metaHowl.howl?.pause();
				this._updateHowlPosition(songId);
			}
		}
	}
	private _seekHowl(position: number, songId: string) {
		if (this.metaHowlMap.has(songId)) {
			const metaHowl = this.metaHowlMap.get(songId) as MetaHowl;
			if (metaHowl.valid) {
				if (metaHowl.loaded) {
					if (metaHowl.duration != Infinity) {
						metaHowl.howl?.seek(position);
						return true;
					}
					metaHowl.howl?.seek(0);
					return true;
				}
				metaHowl.howl?.once('load', () => {
					metaHowl.loaded = true;
					this._seekHowl(position, songId);
				});
				return true;
			}
		}
		return false;
	}

	getAllDurations() {
		return this.songlist.map((song) => {
			const songDuration = this._getHowlDuration(song.id, false);
			return songDuration;
		});
	}

	getSongDuration(songId: string) {
		const metaHowl = this.metaHowlMap.get(songId);
		if (metaHowl) {
			return metaHowl.duration;
		}
		return -1;
	}

	private _getHowlDuration(songId: string, updateValue = false): number {
		const metaHowl = this.metaHowlMap.get(songId);
		if (metaHowl) {
			// const s = this._getSongPerId(songId);
			// console.log('getting duration for this url:', s?.fileSrc);
			// console.log(
			//   'duration:',
			//   metaHowl.howl?.duration(),
			//   metaHowl.howl?.state() === 'loaded'
			// );
			if (updateValue) {
				const howlDuration = metaHowl.howl?.duration();
				// console.log('Updating durations...', howlDuration, metaHowl.howl);
				metaHowl.duration = howlDuration || 0;
				this._updateTotalDuration();

				if (howlDuration === Infinity) {
					// console.log('Duration is infinity on this song:', metaHowl);
					metaHowl.duration = -1;
					this._updateTotalDuration();
				}
			}
			return metaHowl.duration;
		}
		return -1;
	}
	private _updateHowlPosition(songId: string) {
		const metaHowl = this.metaHowlMap.get(songId);
		if (metaHowl) {
			metaHowl.position = metaHowl.howl?.seek() as number;
			if (metaHowl.position > metaHowl.duration) metaHowl.position = metaHowl.duration;
			if (metaHowl.position >= 0 && metaHowl.duration > 0) {
				metaHowl.percentage = metaHowl.position / metaHowl.duration;
			} else {
				metaHowl.percentage = -1;
			}
		}
		return metaHowl;
	}
	private _updateAllHowlPosition(updateValue = false) {
		this.songlist.forEach((song, songIndex) => {
			const metaHowl = this._updateHowlPosition(song.id);
			this._getHowlDuration(song.id, updateValue);
			if (songIndex == this.index) {
				const newPosition = metaHowl?.position || 0;
				if (newPosition != this.position$$.getValue()) {
					this.position$$.next(newPosition);
					this.percentage$$.next(metaHowl?.percentage || 0);
				}
				const newPlaying = !!metaHowl?.howl?.playing() || false;
				if (newPlaying != this.playing$$.getValue()) {
					this.playing$$.next(newPlaying);
				}
			}
		});
	}

	_updateTotalDuration() {
		// cumulate durations if positive
		const durations = this.songlist.map((song) => (song.inactive ? -2 : this.getSongDuration(song.id)));
		const duration = durations.reduce((acc, curr) => acc + (curr > 0 ? curr : 0), 0);
		this.totalDuration$$.next(duration);
	}
}
