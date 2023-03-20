import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-document-step',
	templateUrl: './export-document-step.component.html',
	styleUrls: ['./export-document-step.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDocumentStepComponent {
	steptitle?: string;
	stepdescription?: string;
	documentPath?: string;
	publicName = 'document';

	documentId$$ = new BehaviorSubject<string | undefined>(undefined);

	_documentid?: string;
	public set documentid(v: string | undefined) {
		if (v == this._documentid) return;

		this.documentId$$.next(v);
		this._documentid = v;
	}
	public get documentid(): string | undefined {
		return this._documentid;
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
		if (v) this.documentid = JSON.parse(v).documentid;
	}
	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}

	constructor(private filesRepository: FilesRepository, private cdr: ChangeDetectorRef) {
		this.documentId$$
			.pipe(
				untilDestroyed(this),
				switchMap((documentid: string | undefined) => {
					if (!documentid) return of(undefined);
					return this.filesRepository.get$(documentid);
				}),
				switchMap((entityFile: EntityFile | undefined) => {
					if (!entityFile) return of(undefined);
					this.publicName = entityFile.publicName || this.publicName;
					return this.filesRepository.convertEntityFileIdToUrl$(entityFile.id);
				}),
				tap((fileAsStr: string | undefined) => {
					this.documentPath = fileAsStr;
					this.cdr.markForCheck();
				})
			)
			.subscribe();
	}
	downloadDocument() {
		if (this.documentPath) {
			this.filesRepository.saveAs(this.documentPath, this.publicName);
		}
	}
}
