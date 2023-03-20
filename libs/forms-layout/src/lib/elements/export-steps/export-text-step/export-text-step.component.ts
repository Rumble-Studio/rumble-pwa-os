import { Component, Input } from '@angular/core';
import { NotificationsService } from '@rumble-pwa/client-notifications';

@Component({
	selector: 'rumble-pwa-export-text-step',
	templateUrl: './export-text-step.component.html',
	styleUrls: ['./export-text-step.component.scss'],
})
export class ExportTextStepComponent {
	steptitle?: string;
	stepdescription?: string;
	required = false;

	_textanswer?: string;
	public set textanswer(v: string | undefined) {
		if (v == this._textanswer) return;

		this._textanswer = v;
	}
	public get textanswer(): string | undefined {
		return this._textanswer;
	}

	_attrs: any;
	@Input()
	public set attrs(v: any) {
		this._attrs = JSON.parse(v);
		this.steptitle = this._attrs.steptitle;
		this.stepdescription = this._attrs.stepdescription;
		this.required = this._attrs.required === 'true' ? true : false;
	}
	public get attrs(): any {
		return this._attrs;
	}

	_answerAttrs?: string;
	@Input()
	public set answerAttrs(v: string | undefined) {
		this._answerAttrs = v;
		if (v) this.textanswer = JSON.parse(v).textanswer || 'No answer';
	}
	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}

	constructor(private notificationsService: NotificationsService) {}

	processCopyToClipboardEvent(copied: boolean) {
		if (copied) {
			this.notificationsService.success('Content copied!', undefined, undefined, undefined, 1000);
		} else {
			this.notificationsService.error('Error while copying');
		}
	}
}
