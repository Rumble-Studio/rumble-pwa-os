import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-picture-step',
	templateUrl: './export-picture-step.component.html',
	styleUrls: ['./export-picture-step.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPictureStepComponent {
	steptitle?: string;
	stepdescription?: string;
	imagePath?: string;
	publicName = 'image';

	imageid$$ = new BehaviorSubject<string | undefined>(undefined);

	_imageid?: string;
	public set imageid(v: string | undefined) {
		if (v == this._imageid) return;

		this.imageid$$.next(v);
		this._imageid = v;
	}
	public get imageid(): string | undefined {
		return this._imageid;
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
		if (v) this.imageid = JSON.parse(v).imageid;
	}
	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}

	constructor(private filesRepository: FilesRepository, private cdr: ChangeDetectorRef) {
		this.imageid$$
			.pipe(
				untilDestroyed(this),
				switchMap((imageid: string | undefined) => {
					if (!imageid) return of(undefined);
					return this.filesRepository.get$(imageid);
				}),
				switchMap((entityFile: EntityFile | undefined) => {
					if (!entityFile) return of(undefined);
					this.publicName = entityFile.publicName || this.publicName;
					return this.filesRepository.convertEntityFileIdToUrl$(entityFile.id);
				}),
				tap((fileAsStr: string | undefined) => {
					this.imagePath = fileAsStr;
					this.cdr.markForCheck();
				})
			)
			.subscribe();
	}
	downloadImage() {
		if (this.imagePath) {
			this.filesRepository.saveAs(this.imagePath, this.publicName);
		}
	}
}
