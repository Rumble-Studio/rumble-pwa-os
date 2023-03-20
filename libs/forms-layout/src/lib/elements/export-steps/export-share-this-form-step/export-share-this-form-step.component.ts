import { Component, Input } from '@angular/core';

@Component({
	selector: 'rumble-pwa-export-share-this-form-step',
	templateUrl: './export-share-this-form-step.component.html',
	styleUrls: ['./export-share-this-form-step.component.scss'],
})
export class ExportShareThisFormStepComponent {
	steptitle?: string;
	stepdescription?: string;
	numberOfSharedEmails = 0;

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
	public set answerAttrs(newAnswerAttrs: any) {
		this._answerAttrs = newAnswerAttrs;
		if (newAnswerAttrs) {
			const newAnswerAttrsParsed = JSON.parse(newAnswerAttrs);
			if (
				newAnswerAttrsParsed.emails &&
				typeof newAnswerAttrsParsed.emails === 'string' &&
				newAnswerAttrsParsed.emails.length > 0
			) {
				this.numberOfSharedEmails = newAnswerAttrsParsed.emails.split(';').length;
			} else {
				this.numberOfSharedEmails = 0;
			}
			// this.numberOfSharedEmails = JSON.parse(newAnswerAttrs).emails?.length ?? 0;
		}
	}

	public get answerAttrs(): any {
		return this._answerAttrs;
	}
}
