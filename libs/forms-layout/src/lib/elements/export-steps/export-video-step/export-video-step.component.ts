import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-video-step',
	templateUrl: './export-video-step.component.html',
	styleUrls: ['./export-video-step.component.scss'],
})
export class ExportVideoStepComponent {
	steptitle?: string;
	stepdescription?: string;
	videoPath?: string;

	videoid$$ = new BehaviorSubject<string | undefined>(undefined);

	_videoid?: string;
	public set videoid(v: string | undefined) {
		if (v == this._videoid) return;

		this.videoid$$.next(v);
		this._videoid = v;
	}
	public get videoid(): string | undefined {
		return this._videoid;
	}

	_attrs: any;
	@Input()
	public set attrs(v: any) {
		this._attrs = JSON.parse(v);
		this.steptitle = this._attrs.steptitle;
		this.stepdescription = this._attrs.stepdescription;
	}
	public get attrs(): any {
		return this._attrs;
	}

	_answerAttrs?: string;
	@Input()
	public set answerAttrs(v: string | undefined) {
		this._answerAttrs = v;
		if (v) this.videoid = JSON.parse(v).videoid;
	}
	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}

	constructor(private filesRepository: FilesRepository, private cdr: ChangeDetectorRef) {
		this.videoid$$
			.pipe(
				untilDestroyed(this),
				switchMap((videoid: string | undefined) => {
					if (!videoid) return of(undefined);
					return this.filesRepository.get$(videoid);
				}),
				switchMap((entityFile: EntityFile | undefined) => {
					if (!entityFile) return of(undefined);
					return this.filesRepository.convertEntityFileIdToUrl$(entityFile.id);
				}),
				tap((fileAsStr: string | undefined) => {
					this.videoPath = fileAsStr;
					this.cdr.markForCheck();
				})
			)
			.subscribe();
	}
}
