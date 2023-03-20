/* eslint-disable @typescript-eslint/no-inferrable-types */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-guest-informations-step',
	templateUrl: './export-guest-informations-step.component.html',
	styleUrls: ['./export-guest-informations-step.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportGuestInformationsStepComponent {
	steptitle?: string;
	stepdescription?: string;

	firstname: string = '';
	lastname: string = '';

	_imageid?: string;
	public set imageid(v: string | undefined) {
		if (v == this._imageid) return;

		this.imageid$$.next(v);
		this._imageid = v;
	}
	public get imageid(): string | undefined {
		return this._imageid;
	}
	linkedInLink: string = 'No answer';
	twitterLink: string = 'No answer';
	companyLink: string = 'No answer';
	autoBiography: string = 'No answer';
	imagePath?: string;
	imageid$$ = new BehaviorSubject<string | undefined>(undefined);

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
		if (v) {
			this.firstname = JSON.parse(v).firstname;
			this.lastname = JSON.parse(v).lastname;
			this.imageid = JSON.parse(v).imageid;
			this.linkedInLink = JSON.parse(v).linkedInLink || this.linkedInLink;
			this.twitterLink = JSON.parse(v).twitterLink || this.twitterLink;
			this.companyLink = JSON.parse(v).companyLink || this.companyLink;
			this.autoBiography = JSON.parse(v).autoBiography || this.autoBiography;
		}
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
			const hasName = this.firstname || this.lastname;
			const fileName = (hasName ? this.firstname + '_' + this.lastname : 'image') + '_guest_picture';
			this.filesRepository.saveAs(this.imagePath, fileName);
		}
	}
}
