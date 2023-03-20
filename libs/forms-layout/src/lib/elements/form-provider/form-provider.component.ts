/* eslint-disable @typescript-eslint/no-inferrable-types */
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import {
	AbstractControl,
	FormControlStatus,
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
	ValidationErrors,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { translate, TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '@rumble-pwa/auth-system';
import { BrokerService } from '@rumble-pwa/broker-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import {
	ALL_MACRO_FILE_KINDS,
	convertMacroKindsToAcceptedExtensionsString,
	EntityFile,
	MacroFileKindDefined,
} from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import {
	convertKeyToAttrValue,
	convertStepToStepInstance,
	FormsManagementService,
	prefixAttrWithProvider,
	Provider,
	StepAttribute,
	StepInstance,
} from '@rumble-pwa/forms-system';
import { FormCustomisationDetails, Step } from '@rumble-pwa/mega-store';
import { DEFAULT_RECORDING_PROPS, RecordingProps, RecordingRepository } from '@rumble-pwa/record/state';
import { TracksRepository } from '@rumble-pwa/tracks/state';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	Attr,
	AttrElement,
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { countBy } from 'lodash';
import { of, Subscription } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export function customValidator(attribute: StepAttribute): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const value = control.value;
		console.log('Validating this:', value, 'for', attribute.name);
		// if (!value) {
		//   return null;
		// }
		// const hasUpperCase = /[A-Z]+/.test(value);
		// const hasLowerCase = /[a-z]+/.test(value);
		// const hasNumeric = /[0-9]+/.test(value);
		// const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;
		// return !passwordValid ? { passwordStrength: true } : null;
		return null;
	};
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-provider',
	templateUrl: './form-provider.component.html',
	styleUrls: ['./form-provider.component.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormProviderComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	// current state of the recording repository
	recordingProps: RecordingProps = DEFAULT_RECORDING_PROPS;

	stepsFormGroup: UntypedFormGroup = new UntypedFormGroup({});
	stepsFormGroupSubscription?: Subscription;

	private _valid: FormControlStatus = 'VALID';
	public get valid(): FormControlStatus {
		return this._valid;
	}
	public set valid(value: FormControlStatus) {
		this._valid = value;
		this.validChange.emit(value);
	}
	@Output() validChange = new EventEmitter<FormControlStatus>();

	@Output() forwardEmitter = new EventEmitter<string>();

	private _formStepInstance!: StepInstance;
	public get formStepInstance() {
		return this._formStepInstance;
	}
	public set formStepInstance(value) {
		this._formStepInstance = value;
	}

	prefixAttrWithProvider = prefixAttrWithProvider;

	providerId: Provider['id'] = 'default-participant';

	sectionsToFilter?: string[] | undefined;

	previewMode = false;

	_acceptedFileKinds: MacroFileKindDefined[] = ['audio', 'image', 'video', 'document'];
	acceptedFileExtensionsString = convertMacroKindsToAcceptedExtensionsString(this._acceptedFileKinds);

	private _details!: {
		step?: Step;
		providerId: string;
		answerAttrs?: Attr;
		previewMode: boolean;
		showHostAvatar?: boolean;
		sectionsToFilter?: string[] | undefined;
		isSelected?: boolean;
		formCustomisation?: FormCustomisationDetails;
	};
	public get details() {
		return this._details;
	}
	@Input()
	public set details(details) {
		if (!details.step) return;
		this._details = details;
		this.providerId = details.providerId;
		this.step = details.step;
		this.previewMode = details.previewMode;
		this.showHostAvatar = details.showHostAvatar ?? false;
		this.sectionsToFilter = details.sectionsToFilter;
		this.formCustomisation = details.formCustomisation;

		this.hostImage$$$.id = details.step.formId;

		this.formStepInstance = convertStepToStepInstance(this.step, {
			extraAttrs: {
				providerId: this.providerId,
				attrs: details.answerAttrs ?? {},
			},
		});
		this.updateFormGroup(this.formStepInstance.stepDetail.attributes, details.providerId);
	}

	formCustomisation?: FormCustomisationDetails;
	step?: Step;

	extraAttrs?: {
		providerId: string;
		attrs: Attr;
	};

	@Output() attributeChangeEmitter = new EventEmitter<{
		value: any;
		stepAttribute: StepAttribute;
	}>();

	public countBy = countBy;

	showHostAvatar = false;

	hostImage$$$ = new DataObsViaId<string>((formId: string) =>
		this.formsManagementService.get$(formId).pipe(
			untilDestroyed(this),
			switchMap((form) => {
				if (form) return this.usersRepository.get$(form.ownerId);
				return of(undefined);
			}),
			switchMap((user) => {
				return of(this.usersRepository.getUserAvatar(user));
			}),
			tap(() => this._check())
		)
	);

	hostProfile?: User;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private notificationsService: NotificationsService,
		public filesRepository: FilesRepository,
		private formBuilder: UntypedFormBuilder,
		private brokerService: BrokerService,
		private formsManagementService: FormsManagementService,
		private usersRepository: UsersRepository,
		private _tracksRepository: TracksRepository,
		private _recordingRepository: RecordingRepository,
		private _authService: AuthService,
		private _fileUploadService: FileUploadService,
		private _usersRepository: UsersRepository,
		private _translocoService: TranslocoService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// subscribe to the recording props from recording repository
		this._recordingRepository.recordingProps$
			.pipe(
				untilDestroyed(this),
				tap((props) => {
					this.recordingProps = props;
					this._check();
				})
			)
			.subscribe();

		this.stepsFormGroupSubscription = this.stepsFormGroup.statusChanges
			.pipe(untilDestroyed(this))
			.subscribe((value: FormControlStatus) => {
				this.valid = value;
			});

		// to force host details to be updated
		this.hostImage$$$.$.pipe(untilDestroyed(this)).subscribe();
	}

	public emitChange(
		directValue: AttrElement,
		target: any,
		stepAttribute: StepAttribute,
		ignorePreventEmitting = false,
		trimSpaces = false
	) {
		let value: AttrElement = directValue ?? target?.value ?? null;

		if (trimSpaces && value != null && typeof value === 'string') {
			value = value.trim();
			this.stepsFormGroup.controls[stepAttribute.name].setValue(value);
		}

		if (stepAttribute.providerId !== this.providerId) return;

		if (this.previewMode) {
			return;
		}
		if (stepAttribute.preventEmitting && !ignorePreventEmitting) {
			return;
		}

		console.log('Emitting vlaue:', {
			value,
			stepAttribute,
		});

		this.attributeChangeEmitter.emit({
			value,
			stepAttribute,
		});
		this._check();
	}

	getANewPlaylistId(attribute: StepAttribute) {
		const playlistId = uuidv4();
		this.emitChange(playlistId, undefined, attribute);
		return playlistId;
	}

	getUploadDetailsFromStepAttribute(stepAttribute: StepAttribute, acceptedMacroTypes: any) {
		// TODO : do not return undefined
		// getUploadDetailsFromStepAttribute(stepAttribute: StepAttribute, acceptedMacroTypes: UploadDetails['acceptedMacroTypes']) {
		// const uploadDetails: UploadDetails = {
		// 	description: 'Import a file',
		// 	acceptedMacroTypes,
		// 	askForPublicName: false,
		// 	allowExistingFile: stepAttribute.providerId === 'creator',
		// };
		// return uploadDetails;
		return undefined;
	}
	// processUploadResults(stepAttribute: StepAttribute, uploadResults?: UploadResult[]) {
	processUploadResults(stepAttribute: any, uploadResults?: any) {
		console.warn('Not implemented');
		// if (uploadResults) {
		// 	const value = uploadResults[0].fileId ?? '';
		// 	this.emitChange(uploadResults[0].fileId ?? null, undefined, stepAttribute);
		// 	this.stepsFormGroup.patchValue({
		// 		[stepAttribute.name]: value,
		// 	});
		// }
	}
	clearAsset(attribute: StepAttribute) {
		this.notificationsService.confirm('', 'Are you sure to delete this asset?').subscribe((confirmed) => {
			if (confirmed) {
				this.emitChange(null, undefined, attribute);
				this.stepsFormGroup.patchValue({
					[attribute.name]: '',
				});
			}
		});
	}

	public isHidden(attribute: StepAttribute) {
		return this.convertKeyToAttrValue(attribute, 'hidden') === true;
	}

	public isRequired(attribute: StepAttribute) {
		return this.convertKeyToAttrValue(attribute, 'required') === true;
	}

	public getValue(attribute: StepAttribute, ignoreDontRefill = false) {
		// don't refill is used by the emails list attribute to display a re-usable email input
		if (attribute.dontRefill === true && !ignoreDontRefill) return '';
		return (
			this.formStepInstance.attrs[prefixAttrWithProvider(attribute)]?.toString() ??
			this.convertKeyToAttrValue(attribute, 'default')?.toString() ??
			''
		);
	}

	public getImageUrlFromId$(imageId: string) {
		return this.filesRepository.convertEntityFileIdToUrl$(imageId);
	}
	public getDocumentNameId$(imageId: string) {
		return this.filesRepository.get$(imageId).pipe(map((entityFile) => entityFile?.fileName));
	}

	public getRawValue(attribute: StepAttribute) {
		return this.formStepInstance.attrs[prefixAttrWithProvider(attribute)];
	}

	convertKeyToAttrValue(attribute: StepAttribute, key: keyof StepAttribute = 'label') {
		// console.log(attribute, this.formStepInstance, key);
		const configValue = attribute[key];

		const value = convertKeyToAttrValue(attribute, this.formStepInstance, key);
		if (
			value &&
			typeof value === 'string' &&
			key === 'label' &&
			this.providerId === 'default-participant' &&
			configValue &&
			typeof configValue === 'string' &&
			!configValue.startsWith('@') &&
			!attribute.hiddenToProvider
		) {
			const translatedValue = this._translocoService.translate('formsLayout.formProvider.' + value);
			if (translatedValue !== 'formsLayout.formProvider.' + value) {
				return translatedValue;
			}
			// console.log(configValue);
		}
		return value;
	}

	public filterAttributesOnSections(attributes: StepAttribute[]): StepAttribute[] {
		const sectionsToFilter: string[] = this.sectionsToFilter ?? [];
		if (!this.sectionsToFilter) return attributes;
		return attributes.filter((attribute) => {
			return sectionsToFilter.includes(attribute.section ?? '<no-section>');
		});
	}

	filterAttributesToProvide(attributes: StepAttribute[]): StepAttribute[] {
		return attributes.filter((attribute) => {
			return (
				attribute.providerId === this.providerId && !attribute.name.startsWith('display') && !this.isHidden(attribute)
			);
		});
	}

	openUrl(url: AttrElement) {
		if (!url) {
			this.notificationsService.warning('The URL is empty');
			return;
		}
		if (typeof url === 'string') {
			if (url.startsWith('http')) {
				window.open(url, '_blank');
			} else {
				window.open(`https://${url}`, '_blank');
			}
		}
	}

	updateFormGroup(attributesToFilter: StepAttribute[], playlistidProvider: string | null = null) {
		// console.log('updateFormGroup', this.step?.kind);

		const attributes = this.filterAttributesToProvide(this.filterAttributesOnSections(attributesToFilter));

		if (attributes.length === 0) {
			return;
		}

		// check for missing playlistId for step (from creator)
		attributes
			.filter((attribute) => attribute.kind === 'audio')
			.forEach((attribute) => {
				if (
					!this.formStepInstance.attrs[this.prefixAttrWithProvider(attribute)] &&
					attribute.providerId === playlistidProvider
				) {
					this.getANewPlaylistId(attribute);
				}
			});

		const newStepsFormGroup = attributes
			.filter((attribute) => attribute.providerId === this.providerId)
			.filter((attribute) => !attribute.kind.startsWith('display'))
			.reduce((acc, attribute) => {
				const formControl = new UntypedFormControl(this.getValue(attribute), [
					...(this.isRequired(attribute) ? [Validators.required] : []),
					// ...(this.isRequired(attribute) && attribute.kind === 'image'
					//   ? [customValidator(attribute)]
					//   : []),
					...(this.isRequired(attribute) && attribute.kind === 'audio'
						? [this.playlistRequiredValidator(attribute)]
						: []),
					...(this.isRequired(attribute) && attribute.kind === 'checkbox' ? [Validators.pattern('true')] : []),
					...(attribute.kind === 'url'
						? [
								Validators.pattern(
									"^((((H|h)(T|t)|(F|f))(T|t)(P|p)((S|s)?))\\://)?(www.|[a-zA-Z0-9].)[a-zA-Z0-9\\-\\.]+\\.[a-zA-Z]{2,6}(\\:[0-9]{1,5})*(/($|[a-zA-Z0-9\\.\\,\\;\\?'\\\\+&amp;%\\$#\\=~_\\-]+))*$"
								),
						  ]
						: []),
					...(attribute.kind === 'email'
						? [
								Validators.pattern(
									"^((([!#$%&'*+\\-/=?^_`{|}~\\w])|([!#$%&'*+\\-/=?^_`{|}~\\w][!#$%&'*+\\-/=?^_`{|}~\\.\\w]{0,}[!#$%&'*+\\-/=?^_`{|}~\\w]))[@](www.|[a-zA-Z0-9].)[a-zA-Z0-9\\-\\.]+\\.[a-zA-Z]{2,6}(\\:[0-9]{1,5})*(/($|[a-zA-Z0-9\\.\\,\\;\\?'\\\\+&amp;%\\$#\\=~_\\-]+))*$)$"
								),
						  ]
						: []),
					...(attribute.kind === 'number' ? [Validators.pattern('\\-?\\d*\\.?\\d{1,}')] : []),
				]);
				return { ...acc, [attribute.name]: formControl };
			}, {} as { [key: string]: UntypedFormControl });

		// console.log('%cupdateFormGroup', 'color: #ff0000; font-size: 1.5em; font-weight: bold;', newStepsFormGroup);

		const allFormControlExists = attributes.every((attribute) => {
			// if (!this.stepsFormGroup.controls[attribute.name]) {
			// 	console.log('missing this:', attribute.name);
			// }
			return this.stepsFormGroup.controls[attribute.name];
		});

		if (allFormControlExists) {
			// this is need in order to get dirty controls (if we always rebuild: control do not get dirty and do not show error message).
			// this fix won't work if we changes the validators.
			// convert controls to values
			const newStepsFormGroupValues = Object.keys(newStepsFormGroup).reduce((acc, key) => {
				acc[key] = newStepsFormGroup[key].value;
				return acc;
			}, {} as { [key: string]: string });
			this.stepsFormGroup.patchValue(newStepsFormGroupValues);
		} else {
			// needed to fill the form group the first time or if a condition induces a new form control.
			// console.log('%callFormControlExists false', 'color: red');

			this.stepsFormGroupSubscription?.unsubscribe();

			this.stepsFormGroup = this.formBuilder.group(newStepsFormGroup);
			this.stepsFormGroupSubscription = this.stepsFormGroup.statusChanges
				.pipe(untilDestroyed(this))
				.subscribe((value: FormControlStatus) => {
					this.valid = value;
					this._check();
				});
		}
		this.valid = this.stepsFormGroup.status;
		this._check();
	}

	getFormValidationErrors() {
		Object.keys(this.stepsFormGroup.controls).forEach((key) => {
			if (!this.stepsFormGroup.get(key)?.pristine) {
				this.stepsFormGroup.get(key)?.markAsDirty();
			}
			if (this.stepsFormGroup.get(key)?.value) {
				this.stepsFormGroup.get(key)?.markAsTouched();
			}

			const controlErrors: ValidationErrors | null | undefined = this.stepsFormGroup.get(key)?.errors;
			if (controlErrors) {
				Object.keys(controlErrors).forEach((keyError) => {
					console.log(
						'Key control: ' + key + ', keyError: ' + keyError + ', err value: ',
						controlErrors[keyError],
						'curr value: ',
						this.stepsFormGroup.get(key)?.value
					);
				});
			}
		});
		// this.check();
	}

	processPercentage(percentagePlaying: number, stepAttribute: StepAttribute) {
		if (stepAttribute.providerId !== this.providerId) return;
		if (this.previewMode) {
			return;
		}

		const audioWasPlayedAttribute: StepAttribute = {
			name: 'audioWasPlayed',
			providerId: this.providerId,
			kind: 'checkbox',
			requestOrder: 0,
		};
		const audioWasPlayed = this.getRawValue(audioWasPlayedAttribute) === true;

		if (percentagePlaying > 0.9 && !audioWasPlayed) {
			this.attributeChangeEmitter.emit({
				value: true,
				stepAttribute: audioWasPlayedAttribute,
			});
		}
		this._check();
	}

	processBtnAction(attribute: StepAttribute) {
		// console.log('processBtnAction', attribute);
		if (attribute.buttonTarget === 'next') {
			return this.forwardEmitter.emit('next');
		} else if (attribute.buttonTarget === 'previous') {
			return this.forwardEmitter.emit('prev');
		} else if (attribute.buttonTarget === 'openRumbleApp') {
			if (this.previewMode) {
				this.notificationsService.warning('Action ignored in preview mode.');
				return;
			}
			return window.open(
				'https://app.rumble.studio/?utm_source=rumble-interview&utm_medium=closing-message&utm_campaign=interview_' +
					(this.step?.formId ?? 'unknown-interview') +
					'&utm_id=interview_' +
					(this.step?.formId ?? 'unknown-interview') +
					'',
				'_blank'
			);
		} else if (attribute.buttonTarget === 'welcomeSubmit') {
			this._processWelcomeStepEmail();
		} else if (attribute.buttonTarget === 'welcomeAnonymousSubmit') {
			this._processWelcomeStepAnonymous();
		} else if (attribute.buttonTarget === 'celebrate') {
			this.brokerService.broke('celebrate');
		} else if (attribute.buttonTarget === 'share') {
			this._processShareThisFormEmail();
		} else if (attribute.kind === 'buttonUrl') {
			this.openUrl(this.convertKeyToAttrValue(attribute, 'buttonTarget'));
			const linkWasClicked: StepAttribute = {
				name: 'clicked',
				providerId: this.providerId,
				kind: 'checkbox',
				requestOrder: 0,
			};

			this.attributeChangeEmitter.emit({
				value: true,
				stepAttribute: linkWasClicked,
			});
		}
	}

	public processEmailEnter() {
		if (this.previewMode) {
			this.notificationsService.warning('Action ignored in preview mode.');
			return;
		}
		if (this.formStepInstance.stepDetail.name === 'welcome-step') {
			return this._processWelcomeStepEmail();
		}
		if (this.formStepInstance.stepDetail.name === 'share-this-form') {
			return this._processShareThisFormEmail();
		}
	}

	private _processWelcomeStepEmail() {
		const emailAttribute = this.formStepInstance.stepDetail.attributes.find((attr) => attr.name === 'participantEmail');
		if (!emailAttribute) {
			console.log('no email attribute found, returning.');
			return;
		}
		const userEmail = this.stepsFormGroup.controls.participantEmail.value;
		if (this.previewMode) {
			return this.forwardEmitter.emit('next');
		}
		this.emitChange(userEmail, null, emailAttribute, true);
	}

	private _processWelcomeStepAnonymous() {
		const emailAttribute = this.formStepInstance.stepDetail.attributes.find((attr) => attr.name === 'participantEmail');
		if (!emailAttribute) {
			console.log('no email attribute found, returning.');
			return;
		}
		if (this.previewMode) {
			return this.forwardEmitter.emit('next');
		}
		// instead of using the input email we request an anonymous email to the backend
		this._authService.loginAsAnonymous().subscribe();
	}

	private _processShareThisFormEmail() {
		if (this.stepsFormGroup.controls.emails.valid) {
			const emailsAttribute = this.formStepInstance.stepDetail.attributes.find((attr) => attr.name === 'emails');
			if (emailsAttribute) {
				const emailToAdd: string = this.stepsFormGroup.controls.emails.value;
				const attrValue = this.getValue(emailsAttribute, true);
				this.emitChange(attrValue ? attrValue + ';' + emailToAdd : emailToAdd, null, emailsAttribute, true);
				this.forwardEmitter.emit('share:' + this.stepsFormGroup.controls.emails.value);
				this.stepsFormGroup.controls.emails.reset();
				this.stepsFormGroup.controls.emails.clearValidators();
			}
		}
	}

	processAnyTrackEvent(attribute: StepAttribute) {
		const control = this.stepsFormGroup.get(attribute.name);
		if (control) {
			control.updateValueAndValidity();
		}
	}

	playlistRequiredValidator(attribute: StepAttribute): ValidatorFn {
		// console.log('playlistRequiredValidator');

		return (control: AbstractControl): ValidationErrors | null => {
			const value = control.value;

			// console.log('playlistRequiredValidator', value);

			const allTracks = this._tracksRepository.getTracks(value);
			if (allTracks.length > 0) {
				// console.log('playlistRequiredValidator', 'marking as dirty');

				control.markAsDirty();
			}
			const activeTracks = allTracks.filter((track) => track.active);

			if (activeTracks.length === 0) {
				// console.log('playlistRequiredValidator', 'returning required error');
				return {
					required: true,
				};
			}
			return null;
		};
	}

	/**
	 * Called when dropping files or filling the hidden input
	 * @param fileList
	 * @returns
	 */
	handleFileList(event: any, stepAttribute: StepAttribute) {
		const fileList = event ? (event.target.files as FileList) : [];
		console.log('File list received in form provider:', this.details.step?.kind, fileList);
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;
		if (!stepAttribute) return;
		let _acceptedFileKinds: MacroFileKindDefined[] = ALL_MACRO_FILE_KINDS;
		if (stepAttribute.kind === 'image') {
			_acceptedFileKinds = ['image'];
		} else if (stepAttribute.kind === 'video') {
			_acceptedFileKinds = ['video'];
		} else if (stepAttribute.kind === 'audio') {
			_acceptedFileKinds = ['audio'];
		} else if (stepAttribute.kind === 'document') {
			_acceptedFileKinds = ['document'];
		}
		const preExistingFiles = Array.from(fileList);

		this.filesRepository.accessibleEntityFiles$
			.pipe(
				take(1),
				switchMap((accessibleEntityFiles) => {
					const eligibleFiles: EntityFile[] = accessibleEntityFiles.filter(
						(entityFile) => entityFile.kind === stepAttribute.kind
					);
					return this._fileUploadService.askUserForEntityFiles$(
						ownerId,
						_acceptedFileKinds,
						1,
						translate('fromsLayout.formProvider.Upload a file'),
						undefined,
						preExistingFiles,
						true, // withURls
						eligibleFiles
					);
				}),
				tap((result) => {
					if (result && result[0]) {
						this.emitChange(result[0].id, undefined, stepAttribute);
						this.stepsFormGroup.patchValue({
							[stepAttribute.name]: result[0].id,
						});
					}
					this._check();
				})
			)
			.subscribe();
	}

	public getAcceptedExtensionsString(stepAttribute: StepAttribute) {
		let _acceptedFileKinds: MacroFileKindDefined[] = ALL_MACRO_FILE_KINDS;
		if (stepAttribute.kind === 'image') {
			_acceptedFileKinds = ['image'];
		} else if (stepAttribute.kind === 'video') {
			_acceptedFileKinds = ['video'];
		} else if (stepAttribute.kind === 'audio') {
			_acceptedFileKinds = ['audio'];
		} else if (stepAttribute.kind === 'document') {
			_acceptedFileKinds = ['document'];
		}
		return convertMacroKindsToAcceptedExtensionsString(_acceptedFileKinds);
	}
}
