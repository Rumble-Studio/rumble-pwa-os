// import { Injectable } from '@angular/core';
// import { Track } from './track.model';
// import { TracksStore } from './tracks.store';

// @Injectable({ providedIn: 'root' })
// export class TracksService {
// 	constructor(private tracksStore: TracksStore) {}

// 	add(track: Track) {
// 		this.tracksStore.add(track);
// 	}

// 	update(id: string, track: Partial<Track>) {
// 		this.tracksStore.update(id, track);
// 	}

// 	remove(id: string) {
// 		this.tracksStore.remove(id);
// 	}
// 	removeAll() {
// 		this.tracksStore.remove();
// 	}

// 	upsertMany(tracks: Track[]) {
// 		this.tracksStore.upsertMany(tracks);
// 	}
// 	upsert(track: Track) {
// 		this.tracksStore.upsert(track.id, track);
// 	}
// }
