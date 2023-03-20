import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	Output,
} from '@angular/core';
import { FormControlStatus } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import {
	convertStepToStepInstance,
	DEFAULT_PROVIDERS,
	getPreviewText,
	Provider,
	setStepAttribute,
	StepAttribute,
	StepInstance,
	StepsManagementService,
} from '@rumble-pwa/forms-system';
import { CanBeDebugged, CanCheck, HasLayoutService, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { FormCustomisationDetails, Step } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';
import { AttrElement } from '@rumble-pwa/utils';
import { isEqual, sortBy } from 'lodash';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-editable-step',
	templateUrl: './form-editable-step.component.html',
	styleUrls: ['./form-editable-step.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditableStepComponent extends LayoutSizeAndCheck implements HasLayoutService, CanCheck, CanBeDebugged {
	valid: FormControlStatus = 'VALID'; // one of 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';

	formStepInstance?: StepInstance;

	private _details!: {
		step?: Step;
		index: number;
		canYouEdit?: boolean;
		isLastStep?: boolean;
		collapsed?: boolean;
		formId?: string;
		selectedProviders?: Provider[];
		formCustomisation?: FormCustomisationDetails;
	};

	public get details() {
		return this._details;
	}
	@Input()
	public set details(details) {
		if (!details.step) return;
		this._details = details;
		this.step = details.step;
		this.index = details.index;
		this.canYouEdit = details.canYouEdit ?? true;
		this.isLastStep = details.isLastStep ?? false;
		this.collapsed = details.collapsed;
		this.formId = details.formId;
		this.formCustomisation = details.formCustomisation;
		this.selectedProviders = details.selectedProviders ?? [
			...DEFAULT_PROVIDERS.filter((p) => p.id === 'creator' || p.id === 'default-participant'),
		];
	}

	_step?: Step;
	public set step(v) {
		if (isEqual(v, this._step)) return;
		this._step = v;
		if (v) {
			this.formStepInstance = convertStepToStepInstance(v, {
				// collapsed: v.collapsed,
			});
			this.updateStepInStore();
		}
		this._check();
	}
	public get step() {
		return this._step;
	}

	_index!: number;
	public set index(v: number) {
		this._index = v;
	}
	public get index(): number {
		return this._index;
	}

	canYouEdit = true;
	isLastStep = false;
	formCustomisation?: FormCustomisationDetails;

	private _collapsed?: boolean | undefined = false;
	public get collapsed() {
		return this._collapsed;
	}
	public set collapsed(value) {
		this._collapsed = value;
		this._check();
	}

	private _formId?: string | undefined;
	public get formId(): string | undefined {
		return this._formId;
	}
	public set formId(value: string | undefined) {
		this._formId = value;
		this.updateFormUrl(value || '');
	}
	selectedProviders: Provider[] = [...DEFAULT_PROVIDERS.filter((p) => p.id === 'creator' || p.id === 'default-participant')];

	@Output() askToDuplicate = new EventEmitter<void>();
	@Output() askToMove = new EventEmitter<'up' | 'down'>();
	@Output() askForUpdateSteps = new EventEmitter<StepInstance>();
	@Output() askForUpdateProviders = new EventEmitter<Provider[]>();
	@Output() focused = new EventEmitter<boolean>();

	defaultProviders = DEFAULT_PROVIDERS;

	formUrl = '';
	shiftKeyPressed = false;

	getPreviewText = getPreviewText;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _notificationsService: NotificationsService,
		private _stepsManagementService: StepsManagementService,
		private _usersRepository: UsersRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	@HostListener('window:keydown', ['$event'])
	keyEventDown(event: KeyboardEvent) {
		this.shiftKeyPressed = event.shiftKey;
	}
	@HostListener('window:keyup', ['$event'])
	keyEventUp(event: KeyboardEvent) {
		this.shiftKeyPressed = event.shiftKey;
	}

	updateFormUrl(formId: string) {
		this.formUrl = window.location.origin + '/forms/open/' + formId;
	}

	removeProvider(providerId: string) {
		this.selectedProviders = this.selectedProviders.filter((p) => p.id !== providerId);
		this.askForUpdateProviders.emit(this.selectedProviders);
	}

	toggleProvider(providerId: string) {
		const provider = this.selectedProviders.find((p) => p.id === providerId);
		if (provider) {
			this.selectedProviders = this.selectedProviders.filter((p) => p.id !== providerId);
		} else {
			this.selectedProviders.push(...DEFAULT_PROVIDERS.filter((p) => p.id === providerId));
		}
		this.askForUpdateProviders.emit(this.selectedProviders);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	processProviderSelection(event: any) {
		const newProviders: Provider[] = event.value;
		console.log('processProviderSelection', newProviders);

		this.selectedProviders = sortBy(newProviders, 'priority');
		if (this.selectedProviders.length === 0) {
			console.log({ DEFAULT_PROVIDERS });

			this.selectedProviders = [...DEFAULT_PROVIDERS.filter((p) => p.id === 'creator')];
		}
		this.askForUpdateProviders.emit(this.selectedProviders);
		this._check();
	}

	processCopyToClipboardEvent(copied: boolean) {
		if (copied) {
			this._notificationsService.success('Content copied!', undefined, undefined, undefined, 1000);
		} else {
			this._notificationsService.error('Error while copying');
		}
	}

	moveItem(direction: 'up' | 'down') {
		this.askToMove.emit(direction);
	}

	removeItem() {
		if (!this.formStepInstance) return;
		if (!this.canYouEdit || !this.step) return;
		const stepId = this.step.id;
		if (this._usersRepository.isObjectFavorite(this.step.id, 'step')) {
			this._notificationsService.error('You can not delete a favorite step');
			return;
		}
		if (this.shiftKeyPressed) {
			this._stepsManagementService.archive(stepId);
		} else {
			this._notificationsService
				.confirmWithInput(
					'Are you sure to remove this step?',
					' Next time, press the "Shift" key to avoid confirmation.',
					getPreviewText(this.formStepInstance)
				)
				.subscribe((confirm) => {
					if (confirm) {
						this._stepsManagementService.archive(stepId);
					}
				});
		}
	}

	toggleCollapse() {
		this.collapsed = !this.collapsed;
		this._check();
	}

	processChange(value: AttrElement, stepAttribute: StepAttribute) {
		if (!this.canYouEdit) return;
		if (!this.step) return;

		// console.log('processChange in Editable Step', {
		//   value,
		//   stepAttribute,
		// });

		const updatedStep = setStepAttribute({ ...this.step }, stepAttribute, value);
		this.step = updatedStep;
	}

	updateStepInStore() {
		if (!this.step) return;
		this._stepsManagementService.upsert(this.step);
	}

	processClickColorEvent(color: string) {
		if (color === 'red') this.removeProvider('default-participant');
	}
}
