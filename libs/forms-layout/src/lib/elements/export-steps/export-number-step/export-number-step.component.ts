import { Component, Input } from '@angular/core';
import { NotificationsService } from '@rumble-pwa/client-notifications';

@Component({
	selector: 'rumble-pwa-export-number-step',
	templateUrl: './export-number-step.component.html',
	styleUrls: ['./export-number-step.component.scss'],
})
export class ExportNumberStepComponent {
	steptitle?: string;
	stepdescription?: string;
	required = false;

	_numberanswer?: string;
	public set numberanswer(v: string | undefined) {
		if (v == this._numberanswer) return;

		this._numberanswer = v;
	}
	public get numberanswer(): string | undefined {
		return this._numberanswer;
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
		if (v) this.numberanswer = JSON.parse(v).numberanswer || 'No answer';
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
