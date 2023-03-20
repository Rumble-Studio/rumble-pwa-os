import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService, StepsManagementService } from '@rumble-pwa/forms-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Form, Step } from '@rumble-pwa/mega-store';
import { ObjectColumnComponent, ObjectListComponent, TableClickEvent } from '@rumble-pwa/objects/ui';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { useObsUntilDestroyed } from '@rumble-pwa/utils';
import { switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-list',
	templateUrl: './form-list.component.html',
	styleUrls: ['./form-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		ObjectListComponent,
		ObjectColumnComponent,
		MatTooltipModule,
		MatMenuModule,
		MatIconModule,
		MatCardModule,
		MatSlideToggleModule,
		FormsModule,
		CommonModule,
		ClipboardModule,
		MatButtonModule,
		TrackClickDirective,
	],
})
export class FormListComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	@Input() forms: Form[] = [];

	@Input()
	displayArchivedToggle = true;
	@Output() tableClickEventEmitter = new EventEmitter<TableClickEvent<any>>();

	private _displayArchivedForms = false;
	public get displayArchivedForms() {
		return this._displayArchivedForms;
	}
	@Input()
	public set displayArchivedForms(value) {
		this._displayArchivedForms = value;
		this.displayArchivedFormsChange.emit(value);
	}
	@Output()
	displayArchivedFormsChange = new EventEmitter<boolean>();

	profile: User | null = null;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private formsManagementService: FormsManagementService,
		private stepsManagementService: StepsManagementService,
		private notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _formsManagementService: FormsManagementService,
		public dialog: MatDialog,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);
		useObsUntilDestroyed(this._usersRepository.connectedUser$$, (p) => (this.profile = p), this);
	}

	// Opens a pompt to edit a form
	openFormPromptEditor(form?: Form) {
		this._formsManagementService
			.get$(form?.id ?? '')
			.pipe(
				take(1),
				switchMap((form) => {
					return this._formsManagementService.openPromptEditor({
						modalTitle: form ? 'Update your interview' : 'Create a new interview',
						modalDescription: form ? undefined : 'An interview is the first way to get audio from your guests.',
						modalSubmitText: 'Save',
						formId: form?.id,
						form: form,
					});
				}),
				tap((result) => {
					if (!form && result) {
						this._router.navigate(['/forms/editor/' + result.id]);
					}
				})
			)
			.subscribe();
	}

	duplicateFormWithConfirmation(form: Form) {
		this.notificationsService.confirm('Duplicate ' + form.title + '?').subscribe((result) => {
			if (result) {
				this.duplicateForm(form);
			}
		});
	}

	duplicateForm(form: Form) {
		console.log('duplicateForm FORM', form);

		const now = Math.round(Date.now() / 1000);

		// 1 duplicate the form itself
		const newForm: Form = {
			...form,
			id: uuidv4(),
			title: `${form.title} (copy)`,
			timeUpdate: now,
			timeCreation: now,
		};
		this.formsManagementService.add(newForm);

		// 2 duplicate the form's steps
		const steps: Step[] = this.stepsManagementService.getFormSteps(form.id);
		const newSteps: Step[] = steps.map((step) => this.stepsManagementService.duplicateStep(step, newForm.id));
		console.log('duplicateForm STEPS', { steps, newSteps });

		this.stepsManagementService.upsertMany(newSteps);

		// this.notificationsService.warning(
		//   'The copy of the form does not copy the AUDIO and VIDEO elements yet',
		//   'Info'
		// );
		this._check();
	}

	archiveForm(form: Form) {
		const formSteps = this.stepsManagementService.getFormSteps(form.id);
		const favoriteStepsInForm = formSteps.filter((formStep) => this._usersRepository.isObjectFavorite(formStep.id, 'step'));
		if (favoriteStepsInForm.length > 0) {
			this.notificationsService.error(
				'This interview contains ' +
					favoriteStepsInForm.length +
					' favorite step' +
					(favoriteStepsInForm.length === 1 ? '' : 's') +
					'.',
				'You can not archive interviews that contain favorite steps.'
			);
			return;
		}
		this.notificationsService.confirm().subscribe((result) => {
			if (result) {
				this.formsManagementService.archive(form.id);
				this._check();
			}
		});
	}

	restoreForm(form: Form) {
		this.formsManagementService.restore(form.id);
		this.notificationsService.success('Your interview has been restored');
		this._check();
	}

	deleteForm(form: Form) {
		const formSteps = this.stepsManagementService.getFormSteps(form.id);
		const favoriteStepsInForm = formSteps.filter((formStep) => this._usersRepository.isObjectFavorite(formStep.id, 'step'));
		if (favoriteStepsInForm.length > 0) {
			this.notificationsService.error(
				'This interview contains ' +
					favoriteStepsInForm.length +
					' favorite step' +
					(favoriteStepsInForm.length === 1 ? '' : 's') +
					'.',
				'You can not delete interviews that contain favorite steps.'
			);
			return;
		}
		this.notificationsService.confirm().subscribe((result) => {
			if (result) {
				this.formsManagementService.delete(form.id);
				this._check();
			}
		});
	}

	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		this.tableClickEventEmitter.emit(tableClickEvent);
	}

	public getForFormUrl(formId: string) {
		return window.location.origin + '/forms/open/' + formId;
	}
	public processCopyToClipboardEvent(copied: boolean, message = 'Copied to clipboard!') {
		if (copied) {
			this.notificationsService.success(message, undefined, undefined, undefined, 1000);
		} else {
			this.notificationsService.error('Error while copying');
		}
	}

	public openEditor(formId: string) {
		this._router.navigate(['/forms/editor/' + formId]);
	}
}
