import { Component, Input } from '@angular/core';

@Component({
	selector: 'rumble-pwa-export-call-to-action-step',
	templateUrl: './export-call-to-action-step.component.html',
	styleUrls: ['./export-call-to-action-step.component.scss'],
})
export class ExportCallToActionStepComponent {
	steptitle?: string;
	stepdescription?: string;

	clicked = false;

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

		if (!v) return;

		const clicked = JSON.parse(v).clicked;

		this.clicked = !!clicked;
	}

	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}
}
