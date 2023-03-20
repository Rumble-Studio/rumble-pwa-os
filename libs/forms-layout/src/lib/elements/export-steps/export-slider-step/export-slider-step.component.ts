import { Component, Input } from '@angular/core';

@Component({
	selector: 'rumble-pwa-export-slider-step',
	templateUrl: './export-slider-step.component.html',
	styleUrls: ['./export-slider-step.component.scss'],
})
export class ExportSliderStepComponent {
	steptitle?: string;
	stepdescription?: string;
	required = false;

	_slidervalue?: string;
	public set slidervalue(v: string | undefined) {
		if (v == this._slidervalue) return;

		this._slidervalue = v;
	}
	public get slidervalue(): string | undefined {
		return this._slidervalue;
	}

	minValue?: number;
	maxValue?: number;
	stepSize?: number;
	verticalSlider = false;

	_attrs: any;
	@Input()
	public set attrs(v: any) {
		this._attrs = JSON.parse(v);
		this.steptitle = this._attrs.steptitle;
		this.stepdescription = this._attrs.stepdescription;
		this.minValue = this._attrs.minvalue;
		this.maxValue = this._attrs.maxvalue;
		this.stepSize = this._attrs.stepsize;
		this.verticalSlider = this._attrs.vertical;
		this.required = this._attrs.required === 'true' ? true : false;
	}
	public get attrs(): any {
		return this._attrs;
	}

	_answerAttrs?: string;
	@Input()
	public set answerAttrs(v: string | undefined) {
		this._answerAttrs = v;
		if (v) this.slidervalue = JSON.parse(v).slidervalue || 'No answer';
	}
	public get answerAttrs(): string | undefined {
		return this._answerAttrs;
	}
}
