import { Component, Input } from '@angular/core';
import { Track, TracksRepository } from '@rumble-pwa/tracks/state';
import { DataObsViaId } from '@rumble-pwa/utils';

@Component({
	selector: 'rumble-pwa-export-audio-step',
	templateUrl: './export-audio-step.component.html',
	styleUrls: ['./export-audio-step.component.scss'],
})
export class ExportAudioStepComponent {
	steptitle?: string;
	stepdescription?: string;
	playlistid?: string;

	_answerplaylistid?: string;
	public set answerplaylistid(v: string | undefined) {
		this._answerplaylistid = v;
		this.tracks$$$.id = v;
	}
	public get answerplaylistid(): string | undefined {
		return this._answerplaylistid;
	}

	tracks$$$ = new DataObsViaId<Track[]>((playlistid) => this._tracksRepository.getTracks$(playlistid));

	_attrs: any;
	@Input()
	public set attrs(v: any) {
		this._attrs = JSON.parse(v);
		this.steptitle = this._attrs.steptitle;
		this.stepdescription = this._attrs.stepdescription;
		this.playlistid = this._attrs.playlistid;
	}
	public get attrs(): any {
		return this._attrs;
	}

	_answerAttrs?: string;
	@Input()
	public set answerAttrs(v: string | undefined) {
		this._answerAttrs = v;

		if (!v) return;
		const playlistId = JSON.parse(v).playlistid;
		if (!playlistId) return;

		this.answerplaylistid = playlistId;
	}
	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}

	constructor(private _tracksRepository: TracksRepository) {
		this.tracks$$$.$.pipe().subscribe();
	}
}
