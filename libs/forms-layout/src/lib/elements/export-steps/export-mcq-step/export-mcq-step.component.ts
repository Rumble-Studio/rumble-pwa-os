import { Component, Input } from '@angular/core';

@Component({
	selector: 'rumble-pwa-export-mcq-step',
	templateUrl: './export-mcq-step.component.html',
	styleUrls: ['./export-mcq-step.component.scss'],
})
export class ExportMcqStepComponent {
	required = false;

	stepOptions: string[] = [];
	stepQuestion = '';

	_stepanswer?: string[];
	public set stepanswer(v: string[] | undefined) {
		if (v == this._stepanswer) return;
		this._stepanswer = v;
	}
	public get stepanswer(): string[] | undefined {
		return this._stepanswer;
	}

	multipleChoicesAllowed = true;

	_attrs: any;
	@Input()
	public set attrs(v: any) {
		this._attrs = JSON.parse(v);
		this.stepQuestion = this._attrs.stepQuestion;
		this.stepOptions = (this._attrs.stepOptions ?? '').split(';');
		this.required = this._attrs.required === 'true' ? true : false;
		this.multipleChoicesAllowed = this._attrs.multipleChoicesAllowed;
	}
	public get attrs(): any {
		return this._attrs;
	}

	_answerAttrs?: string;
	@Input()
	public set answerAttrs(v: string | undefined) {
		this._answerAttrs = v;
		if (v) this.stepanswer = JSON.parse(v).stepanswer || 'No answer';
	}
	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}
}
