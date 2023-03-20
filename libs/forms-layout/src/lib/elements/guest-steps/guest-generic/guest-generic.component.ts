/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControlStatus } from '@angular/forms';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Provider, StepAttribute } from '@rumble-pwa/forms-system';
import { FormCustomisationDetails, Step } from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { Attr, AttrElement } from '@rumble-pwa/utils';

@Component({
	selector: 'rumble-pwa-guest-generic',
	templateUrl: './guest-generic.component.html',
	styleUrls: ['./guest-generic.component.scss'],
})
export class GuestGenericComponent {
	@Output() guestFormIsValidChange = new EventEmitter<FormControlStatus | undefined>();
	private _guestFormIsValid?: FormControlStatus | undefined;
	public get guestFormIsValid() {
		return this._guestFormIsValid;
	}
	public set guestFormIsValid(value) {
		this._guestFormIsValid = value;
		this.guestFormIsValidChange.emit(value);
	}

	displayGuestContent = true;
	displayHostContent = true;
	displayIdentificationContent = true;

	private _details: {
		step?: Step;
		attrs?: Attr;
		isSelected?: boolean;
		providerId: string;
		previewMode: boolean;
		answerId?: string;
		answerAttrs: Attr;
		user?: User;
		showHostAvatar?: boolean;
		formCustomisation?: FormCustomisationDetails;
	} = {
		providerId: 'default-participant',
		previewMode: false,
		answerAttrs: {},
	};
	public get details() {
		return this._details;
	}
	@Input()
	public set details(details) {
		if (!details.step) return;
		this._details = details;
		this.step = details.step;
		this.attrs = details.attrs;
		this.isSelected = details.isSelected ?? false;
		this.providerId = details.providerId;
		this.previewMode = details.previewMode;
		this.answerId = details.answerId;
		this.answerAttrs = details.answerAttrs;
		this.user = details.user;
		this.showHostAvatar = details.showHostAvatar ?? false;
		this.formCustomisation = details.formCustomisation;
	}

	// STEP
	private _step?: Step;
	public get step() {
		return this._step;
	}
	public set step(value) {
		this._step = value;
		this.rank = this.step?.rank;
	}

	rank?: number;

	_attrs?: Attr;
	public set attrs(v) {
		this._attrs = v;
	}
	public get attrs() {
		return this._attrs;
	}

	isSelected = false;

	// FORM
	providerId: Provider['id'] = 'default-participant';
	previewMode: boolean = false;
	formCustomisation?: FormCustomisationDetails;

	// ANSWER
	answerId?: string;

	@Output()
	answerEvent: EventEmitter<string> = new EventEmitter();

	_answerAttrs!: Attr;
	public set answerAttrs(newAnswerAttrs) {
		this._answerAttrs = newAnswerAttrs;
	}
	public get answerAttrs() {
		return this._answerAttrs;
	}

	// USER
	user?: User;

	showHostAvatar = false;

	@Output() forwardEmitter = new EventEmitter<string>();

	constructor(protected notificationsService: NotificationsService) {}

	goNext() {
		this.forwardEmitter.emit('next');
	}

	goPrev() {
		this.forwardEmitter.emit('prev');
	}

	forward(order: string) {
		this.forwardEmitter.emit(order);
	}

	emitAnswer(attrsAsString: string) {
		this.answerEvent.emit(attrsAsString);
	}

	public processChange(value: AttrElement, stepAttribute: StepAttribute) {
		if (!this.step) return;

		console.log('processChange in Guest Generic', {
			value,
			stepAttribute,
		});

		const attrsAsString = JSON.stringify({
			[stepAttribute.name]: value,
		});

		console.log('attrsAsString', attrsAsString);

		this.emitAnswer(attrsAsString);
	}
}
