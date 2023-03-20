import { Injectable, TemplateRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Brand } from '@rumble-pwa/brands/state';
import { BrokerService } from '@rumble-pwa/broker-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { GroupsManagementService, PermissionService } from '@rumble-pwa/groups-system';
import {
	Form,
	FormData,
	FormsQuery,
	FormsService,
	Grant,
	Group,
	NEW_FORM_CUSTOMISATION,
	Playlist,
	PlaylistsService,
	Step,
	StepsQuery,
	StepsService,
} from '@rumble-pwa/mega-store';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { ObjectAttributeOption, ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { RestService } from '@rumble-pwa/requests';
import { Track, TracksRepository } from '@rumble-pwa/tracks/state';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { Attr, slugify } from '@rumble-pwa/utils';
import { sortBy, uniqBy } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { FormTemplate, FORM_TEMPLATES, StepTemplate } from './config/steps.config';
import { FormTemplatePreviewComponent } from './form-template-preview/form-template-preview.component';

export type ExtendedForm = Partial<Form> & {
	groups?: string[];
	propertyInterviewPreventEditing?: boolean;
	selectedTemplate?: FormTemplate;
	displayExistingFormAsTemplates?: boolean;
	displayBasicTemplate?: boolean;
	displaySearchTemplate?: string;
	displayInterviewsTitle?: string;
};
@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class FormsManagementService {
	forms$$: BehaviorSubject<Form[]>;
	sharedForms$: Observable<Form[]>;

	/** Groups are used for prompt opening to share brands */
	private _groupsForSharing?: Group[];

	constructor(
		private _restService: RestService,
		private _formsService: FormsService,
		private _formsQuery: FormsQuery,
		private _stepsService: StepsService,
		private _filesRepository: FilesRepository,
		private _playlistsService: PlaylistsService,
		private _tracksRepository: TracksRepository,
		private _usersRepository: UsersRepository,
		private _brokerService: BrokerService,
		private _groupsManagementService: GroupsManagementService,
		private _permissionService: PermissionService,
		private _objectPromptService: ObjectPromptService,
		private _stepsQuery: StepsQuery,
		private _notificationsService: NotificationsService,
		private _amplitudeService: AmplitudeService // private viewContainerRef: ViewContainerRef, // private renderer: Renderer2
	) {
		// console.log('%c[FormsManagementService](constructor)', 'color: #00a7e1; font-weight: bold');

		this.forms$$ = this._formsQuery.forms$$;

		this.sharedForms$ = combineLatest([this._groupsManagementService.groups$$, this._usersRepository.connectedUser$$]).pipe(
			untilDestroyed(this),
			switchMap(([groups, profile]) => {
				const sharedForms$: Observable<Form | undefined>[] = [];
				if (profile) {
					const formIds: string[] = [];
					groups.forEach((group) => {
						const grants: Grant[] = this._groupsManagementService.fillChildrenRecursively(group.id)?.grants ?? [];
						grants.forEach((grant) => {
							const parameters = JSON.parse(grant.parameters || '{}');
							if (!parameters.scriptId) return;
							const formId = parameters.scriptId;
							const form$: Observable<Form | undefined> = this.get$(formId);
							if (formIds.includes(formId)) return;
							formIds.push(formId);
							sharedForms$.push(form$);
						});
					});
				}
				return combineLatest(sharedForms$);
			}),
			map((sharedForms) => sharedForms.filter((sharedForm): sharedForm is Form => !!sharedForm)),
			map((sharedForms) => sharedForms.filter((sharedForm) => sharedForm.state === 'default')),
			startWith([])
		);

		// get all groups for sharing option in prompt editor
		this._groupsManagementService
			.getAll$()
			.pipe(
				tap((groups) => {
					this._groupsForSharing = [
						...groups.filter((g) => ['team', 'folder'].includes(g.kind) && g.state === 'default'),
					];
				})
			)
			.subscribe();

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				this.pushData();
				this.pullData();
			});
	}

	pullData() {
		// get forms data from server
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn)
				this._restService.get<Form[]>('/forms').subscribe((formApis) => {
					// upsert forms to local store
					this._formsService.upsertMany(
						formApis.map((formApis) => {
							return { ...formApis, operation: 'refresh' };
						})
					);
				});
		});
	}

	pushData() {
		this._formsQuery.formsToSync$.pipe(debounceTime(300)).subscribe((forms) => {
			forms.forEach((form) => {
				// console.log('form operation:', form?.operation);
				if (form?.operation === 'creation') {
					this._postToServer(form);
				} else if (form?.operation === 'update') this._putToServer(form);
				else {
					console.log('Unknown operation on form store:', {
						operation: form.operation,
					});
				}
			});
			this._brokerService.broke('refresh-notifications');
		});
	}

	public add(data: Form) {
		this._formsService.add(data);
	}
	public update(id: string, data: Partial<Form>) {
		if (this.get(id)?.ownerId !== this._usersRepository.connectedUser$$.getValue()?.id) {
			console.warn("You can't update a script that is not yours");
			return;
		}
		this._formsService.update(id, data);
	}
	public upsert(data: Form, who: string) {
		// console.log('Upserting form', who);
		console.log('Upserting form', {
			data,
			userId: this._usersRepository.connectedUser$$.getValue()?.id,
			dataGet: this.get(data.id),
		});
		this._formsService.upsert(data);
	}
	public removeFromStore(id: string) {
		this._formsService.remove(id);
	}
	public delete(id: string) {
		this._formsService.update(id, { state: 'deleted' });
	}
	public archive(id: string) {
		this._formsService.update(id, { state: 'archived' });
	}
	public restore(id: string) {
		this._formsService.update(id, { state: 'default' });
	}

	public canAnonymousAccess(id: string): Observable<boolean | undefined> {
		return this._restService.get<boolean>('/forms/' + id + '/anonymous-allowed');
	}

	public get(id: string) {
		return this._formsQuery.getEntity(id);
	}
	public get$(id: string) {
		return this._formsQuery.selectEntity(id);
	}

	public getAllAccessible$() {
		// get all owned forms
		return combineLatest([
			this._formsQuery.selectAll({
				sortBy: 'timeUpdate',
				filterBy: (entity) => ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
			}),
			this._usersRepository.connectedUser$$,
		]).pipe(map(([forms, profile]) => forms.filter((form) => form.ownerId === profile?.id)));
	}

	//
	// SERVER SYNC
	//
	private _putToServer(form: Form) {
		return this._restService
			.put<Form>('/forms/' + form.id, form)
			.pipe(
				tap((r) => {
					this._formsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}
	private _postToServer(form: Form) {
		return this._restService
			.post<Form>('/forms', form)
			.pipe(
				tap((r) => {
					this._formsService.upsert({ ...r, operation: 'refresh' });
				})
			)
			.subscribe();
	}

	// CUSTOM FN FOR FORMS

	requestShareFormInvitation$(formId: string, email: string) {
		return this._restService.post<{
			success: boolean;
			status_code?: string;
			error_message?: string;
		}>('/forms/' + formId + '/share', {
			email: email,
		});
	}

	/**
	 * Request form/full endpoint to get all relative data to a specific form
	 * @param formId
	 * @returns
	 */
	fetchFormData$(formId: string) {
		return this._restService
			.get<{
				form: Form;
				brands: Brand[];
				files: EntityFile[];
				playlists: Playlist[];
				steps: Step[];
				tracks: Track[];
				users: User[];
			}>('/forms/' + formId + '/full')
			.pipe(
				// take(1),
				tap((r) => {
					this._formsService.upsert({ ...r.form, operation: 'refresh' });

					r.files.forEach((file) => {
						// todo check:
						this._filesRepository.refreshEntityFile(file);
					});

					r.playlists.forEach((playlist) => {
						this._playlistsService.upsert({ ...playlist, operation: 'refresh' });
					});

					r.steps.forEach((step) => {
						this._stepsService.upsert({ ...step, operation: 'refresh' });
					});

					r.tracks.forEach((track) => {
						this._tracksRepository.upsertTrack({ ...track, operation: 'refresh' });
					});

					r.users.forEach((user) => {
						this._usersRepository.upsertUser({ ...user, operation: 'refresh' });
					});
				})
			);
		// .subscribe();
	}

	generateInterviewFromTemplate(
		stepsToGenerate: StepTemplate[],
		formId: string,
		keepAttrs?: boolean,
		welcomeAndTermination = false
	) {
		if (welcomeAndTermination)
			stepsToGenerate = [{ stepKind: 'welcome-step' }, ...stepsToGenerate, { stepKind: 'termination' }];

		const now = Math.round(Date.now() / 1000);

		stepsToGenerate.forEach((stepToGenerate, stepToGenerateIndex) => {
			let newStepAttrs: Attr = {};

			// duplicating playlist if step attrs are kept
			if (keepAttrs) {
				Object.entries(stepToGenerate.stepAttrs ?? {}).map(([attr, value]) => {
					if (attr === 'playlistid' && typeof value === 'string') {
						const newValue = this._tracksRepository.duplicatePlaylist(value);
						newStepAttrs = {
							...newStepAttrs,
							[attr]: newValue,
						};
					} else {
						newStepAttrs = {
							...newStepAttrs,
							[attr]: value,
						};
					}
				});
			}

			const step: Step = {
				id: uuidv4(),
				rank: stepToGenerateIndex + 1,
				formId,
				kind: stepToGenerate.stepKind,
				attrs: JSON.stringify(newStepAttrs),
				timeUpdate: now,
				timeCreation: now,
				toSync: true,
			};
			this._stepsService.add(step);
		});
	}

	public getFormAsFormTemplate(
		formId: string,
		keepStepsAttrs?: boolean,
		removeWelcomeAndClosingSteps?: boolean
	): FormTemplate {
		const form = this.get(formId);
		const steps = this._stepsQuery.getAll({
			sortBy: 'rank',
			filterBy: (entity) => entity.formId === formId && ['deleted', 'archived'].indexOf(entity.state || 'default') == -1,
		});
		const stepsAsStepsTemplate = steps
			.map((step) => {
				const stepAttrs = JSON.parse(step.attrs);
				const stepAsStepTemplate: StepTemplate = {
					stepKind: step.kind,
					stepAttrs: keepStepsAttrs ? stepAttrs : undefined,
				};
				return stepAsStepTemplate;
			})
			.filter((step) =>
				removeWelcomeAndClosingSteps ? ['welcome-step', 'termination'].indexOf(step.stepKind) > -1 : true
			);

		const formAsFormTemplate: FormTemplate = {
			id: formId,
			templateName: form?.title ?? 'Interview',
			templateDescription: form?.description,
			stepTemplateList: stepsAsStepsTemplate,
		};

		return formAsFormTemplate;
	}

	canDisplayGroupSetting() {
		const userId = this._usersRepository.connectedUser$$.getValue()?.id;
		return this._permissionService.can('menu-display-group', userId);
	}

	/**
	 * Open the object prompt to edit the form
	 */
	public openPromptEditor(options?: {
		formId?: string;
		form?: Form;
		modalTitle?: string;
		modalDescription?: string;
		modalSubmitText?: string;
		formTemplatePreviewTpl?: TemplateRef<HTMLElement>;
		formTemplatePreviewComponent?: any;
		formTemplatePreviewComponentInjector?: any;
	}): Observable<ExtendedForm | undefined> {
		const emptyFormData: FormData = {};
		const formData: FormData = options?.form?.data ? JSON.parse(options.form.data) : emptyFormData;
		const basicTemplates: FormTemplate[] = FORM_TEMPLATES;

		const basicTemplatesAsAttributeOptions = basicTemplates.map((formTemplate) => ({
			name: formTemplate.templateName,
			value: formTemplate,
			customComponent: FormTemplatePreviewComponent,
			customPropertiesMapping: {
				formTemplate,
			},
		}));

		const existingForms = this.forms$$.value.filter(
			(form) => form.state == 'default' && form.ownerId === this._usersRepository.connectedUser$$.getValue()?.id
		);

		const existingFormsAsFormsTemplate = sortBy(
			existingForms.map((form) => this.getFormAsFormTemplate(form.id, true)),
			function (formTemplate) {
				return slugify(formTemplate.templateName);
			}
		);
		const existingFormsAsAttributeOptions = existingFormsAsFormsTemplate.map((formTemplate) => ({
			name: formTemplate.templateName,
			value: formTemplate,
			customComponent: FormTemplatePreviewComponent,
			customPropertiesMapping: {
				formTemplate,
			},
		}));

		const now = new Date();
		const defaultTitle = 'New interview ' + now.toLocaleDateString();

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedForm>({
				modalTitle: options?.modalTitle ?? 'Interview',
				modalDescription: options?.modalDescription,
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				objectId: options?.formId,
				object: {
					...options?.form,
					groups: formData.sharedWith,
					propertyInterviewPreventEditing: formData.preventEditing ?? false,
					displayExistingFormAsTemplates: false,
					displayBasicTemplate: true,
				},
				attributes: [
					{
						name: 'title',
						HTMLlabel: 'Interview title',
						defaultValue: defaultTitle,
						placeholder: 'Ex. Interview for heroes',
						required: true,
						validators: Validators.maxLength(256),
					},
					{
						name: 'description',
						HTMLlabel: 'Interview description (private and optional)',
						placeholder: 'Ex. This is the list of questions for Superman and Batman.',
					},
					{
						name: 'displayInterviewsTitle',
						HTMLlabel: 'Select a template:',
						attributeType: 'displayText',
					},
					{
						name: 'displayBasicTemplate',
						HTMLlabel: 'Display sample templates (' + basicTemplates.length + ')',
						attributeType: 'slide-toggle',
						callBack: (value, promptComponent) => {
							const templateForm = promptComponent.attributes.find((oa) => oa.name == 'selectedTemplate');
							if (!templateForm || !templateForm.extra) return;

							const extraOptions = templateForm.extra.options ?? [];

							if (value) {
								const templatesToAdd: ObjectAttributeOption[] = [];
								basicTemplatesAsAttributeOptions.forEach((basicTemplate) => {
									if (extraOptions?.includes(basicTemplate)) return;
									templatesToAdd.push(basicTemplate);
								});
								templateForm.extra.options = [...templatesToAdd, ...extraOptions];
							} else {
								templateForm.extra.options = [...extraOptions].filter(
									(objAttr) =>
										!basicTemplatesAsAttributeOptions.some((bas) => bas.value.id === objAttr.value.id)
								);
							}
							promptComponent._check();
						},
					},
					{
						name: 'displayExistingFormAsTemplates',
						HTMLlabel: 'Display existing interviews as templates (' + existingFormsAsFormsTemplate.length + ')',
						attributeType: 'slide-toggle',
						callBack: (value, promptComponent) => {
							const templateForm = promptComponent.attributes.find((oa) => oa.name == 'selectedTemplate');
							if (!templateForm || !templateForm.extra) return;

							const extraOptions = templateForm.extra.options ?? [];

							if (value) {
								const templatesToAdd: ObjectAttributeOption[] = [];
								existingFormsAsAttributeOptions.forEach((existingFormAsTemplate) => {
									if (extraOptions?.includes(existingFormAsTemplate)) return;
									templatesToAdd.push(existingFormAsTemplate);
								});
								templateForm.extra.options = [...extraOptions, ...templatesToAdd];
							} else {
								templateForm.extra.options = [...extraOptions].filter(
									(objAttr) =>
										!existingFormsAsAttributeOptions.some((eFT) => eFT.value.id === objAttr.value.id)
								);
							}
							promptComponent._check();
						},
					},
					{
						// displayText used as a divider, like <br />
						name: 'displayInterviewsTitle',
						HTMLInputSubtype: 'text',
						HTMLlabel: '',
						attributeType: 'displayText',
					},
					{
						name: 'displaySearchTemplate',
						HTMLlabel: 'Or search a template...',
						placeholder: 'Ex. Interview for heroes',
						callBack: (value, promptComponent) => {
							const templateForm = promptComponent.attributes.find((oa) => oa.name == 'selectedTemplate');
							if (!templateForm || !templateForm.extra) return;

							const basicTemplateFormControl = promptComponent.attributeForm.get('displayBasicTemplate');
							const existingFormAsTemplateFormControl =
								promptComponent.attributeForm.get('displayExistingFormAsTemplates');

							const extraOptions = [...basicTemplatesAsAttributeOptions, ...existingFormsAsAttributeOptions];

							if (value) {
								// basicTemplateFormControl?.patchValue(true);
								// existingFormAsTemplateFormControl?.patchValue(true);
								templateForm.extra.options = extraOptions.filter((option) => option.name.includes(value));
							} else {
								const optionsToAdd: ObjectAttributeOption[] = [];
								if (basicTemplateFormControl?.value) optionsToAdd.push(...basicTemplatesAsAttributeOptions);
								if (existingFormAsTemplateFormControl?.value)
									optionsToAdd.push(...existingFormsAsAttributeOptions);

								templateForm.extra.options = optionsToAdd;
							}
							promptComponent._check();
						},
					},
					{
						name: 'selectedTemplate',
						attributeType: 'radioSelect',
						hidden: !!options?.form?.id,
						extra: {
							options: [...basicTemplatesAsAttributeOptions],
							// options: [...basicTemplatesAsAttributeOptions, ...existingFormsAsAttributeOptions],
						},
					},
					{
						name: 'propertyInterviewPreventEditing',
						HTMLlabel: 'Prevent editing',
						explanation:
							"This option allows you to deactivate the 'Create' tab to prevent further editing on this interview.",
						hidden: !options?.form?.id,
						attributeType: 'select',
						defaultValue: false,
						extra: {
							options: [
								{
									name: 'Read only',
									value: true,
								},
								{
									name: 'Editing allowed',
									value: false,
								},
							],
						},
					},
					{
						name: 'groups',
						HTMLlabel: 'Share with',
						defaultValue: [],
						attributeType: 'select',
						multiple: true,
						hidden: !this.canDisplayGroupSetting() || !options?.form?.id,
						extra: {
							options: this._groupsForSharing
								?.filter((group) => group.kind === 'team' || group.kind === 'folder')
								.map((group) => {
									const displayedGroupName = group.name || group.description || group.kind;
									return {
										name: displayedGroupName,
										value: group.id,
									};
								}),
						},
					},
				],
			})
			.pipe(
				switchMap((result: Partial<ExtendedForm> | undefined) => {
					const fromFormTemplate = basicTemplates.some(
						(formTemplate) => formTemplate.id === result?.selectedTemplate?.id
					);
					const containsAttrs = result?.selectedTemplate?.stepTemplateList.some((step) =>
						step.stepAttrs ? Object.keys(step.stepAttrs).length > 0 : false
					);

					if (containsAttrs && !fromFormTemplate) {
						return this._notificationsService
							.confirm(
								'Use existing content (audio, texts, images...)?',
								undefined,
								'No, I just want the empty steps',
								'Yes, copy the content too'
							)
							.pipe(
								map((confirm) => {
									return {
										result,
										confirm,
									};
								})
							);
					} else return of({ result, confirm: false });
				}),
				map((resultEnhanced: { result: Partial<ExtendedForm> | undefined; confirm: boolean }) => {
					if (!resultEnhanced.result) return;
					if (options?.formId) {
						const emptyFormData: FormData = {};
						const formData: FormData = options.form?.data ? JSON.parse(options.form.data) : emptyFormData;
						formData.preventEditing = resultEnhanced.result.propertyInterviewPreventEditing;

						const newSharedWithIds = resultEnhanced.result.groups?.sort();

						formData.sharedWith = newSharedWithIds;
						this.update(options.formId, {
							title: resultEnhanced.result.title,
							description: resultEnhanced.result.description,
							data: JSON.stringify(formData),
						});
						return resultEnhanced.result;
					} else {
						const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
						if (!ownerId) {
							console.warn('No owner id at saving...');
							return;
						}

						const newFormData: FormData = {
							customisationDetails: NEW_FORM_CUSTOMISATION,
						};

						const newFormId = uuidv4();
						const newForm: Form = {
							id: newFormId,
							ownerId,
							title: resultEnhanced.result.title,
							description: resultEnhanced.result.description,
							data: JSON.stringify(newFormData),
						};
						this._amplitudeService.saveEvent('form-properties:new-form', {
							form: newForm,
						});
						this.add(newForm);
						const stepsToGenerate = resultEnhanced.result.selectedTemplate?.stepTemplateList;
						if (stepsToGenerate && stepsToGenerate.length > 0) {
							this.generateInterviewFromTemplate(stepsToGenerate, newFormId, resultEnhanced.confirm);
						}
						return this.get(newFormId);
					}
				})
			);
	}

	/**
	 * Filter out duplicate form templates
	 * @param formTemplates Array to filter
	 * @param filterStepKindOnly will filter out templates with same step list
	 * @param filterPlaylistIdContent will filter out templates with same step list, same step attrs (hence same files)
	 * @returns
	 */
	uniqueFormTemplates(
		formTemplates: FormTemplate[],
		filterStepKindOnly = false,
		filterPlaylistIdContent = false
	): FormTemplate[] {
		return uniqBy(formTemplates, (formTemplate) =>
			formTemplate.stepTemplateList
				.map((stepTemplate) => {
					if (filterStepKindOnly) return stepTemplate.stepKind;
					else
						return (
							stepTemplate.stepKind +
							Object.entries(stepTemplate.stepAttrs ?? {})
								.map(([attr, value]) => {
									if (filterPlaylistIdContent && attr === 'playlistid' && typeof value === 'string') {
										const fileIds = this._tracksRepository
											.getAll()
											.filter((track) => track.playlistId === value)
											.map((track) => track.fileId)
											.filter((fileId): fileId is string => !!fileId);
										return 'fileids' + fileIds.join();
									} else return attr + value;
								})
								.join()
						);
				})
				.join()
		);
	}
}
