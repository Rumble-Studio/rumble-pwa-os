import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { Form, FormData } from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { DataObsViaId, useObsUntilDestroyed } from '@rumble-pwa/utils';
import { merge, of } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';

export interface FormOpenerData {
	formId: string;
	stepId?: string;
	embedded?: boolean;
	providerId?: string;
	previewMode?: boolean;
	confirmationMessage?: string;
	closingMessage?: string;
	closeWithoutConfirmation?: boolean;
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-opener-prompt',
	templateUrl: './form-opener-prompt.component.html',
	styleUrls: ['./form-opener-prompt.component.scss'],
})
export class FormOpenerPromptComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	providerId = 'default-participant';
	isOffline = false;

	form$$$ = new DataObsViaId<Form>((formId: string) => this.formsManagementService.get$(formId));

	connectedUser: User | null = null;

	formIsLoading = true;
	stepId?: string;

	dataWasFetched = false;
	previewMode = false;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _dialogRef: MatDialogRef<FormOpenerPromptComponent>,
		private formsManagementService: FormsManagementService,
		public dialog: MatDialog,
		private notificationsService: NotificationsService,
		private usersRepository: UsersRepository,
		@Inject(MAT_DIALOG_DATA)
		public data: FormOpenerData
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.form$$$.id = data.formId;
		this.providerId = data.providerId ?? this.providerId;
		this.previewMode = data.previewMode ?? this.previewMode;
		this.stepId = data.stepId;

		this.form$$$.id$$
			.pipe(
				untilDestroyed(this),
				filter((formId) => !!formId),
				switchMap((formId: string | undefined) => {
					if (formId && !this.dataWasFetched) {
						this.formIsLoading = true;
						this.dataWasFetched = true;
						return this.formsManagementService.fetchFormData$(formId);
					} else {
						this.formIsLoading = false;
						return of(undefined);
					}
				}),
				tap(() => {
					this.formIsLoading = false;
				}),
				catchError((error, _) => {
					console.log('error', error);

					this.notificationsService.error('Interview not found.', 'Error');
					this.formIsLoading = false;
					return of(undefined);
				})
			)
			.subscribe();

		this.form$$$.$.pipe(
			untilDestroyed(this),
			tap((form: Form | undefined) => {
				if (form) {
					const data: FormData = JSON.parse(form.data || '{}');
					this.isOffline = data.isOffline ?? false;
					if (this.isOffline) {
						this.notificationsService.info('This interview is not available right now.', 'Offline');
					}
				}
			})
		).subscribe();

		useObsUntilDestroyed(this.usersRepository.connectedUser$$, (p) => (this.connectedUser = p), this);

		this._dialogRef.disableClose = true;

		merge(this._dialogRef.keydownEvents().pipe(filter((e) => e.key === 'Escape')), this._dialogRef.backdropClick())
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this.notificationsService
						.confirm(
							this.data.confirmationMessage ?? 'Are you sure to close this interview?',
							undefined,
							'Stay here',
							'Close interview'
						)
						.subscribe((confirmation) => {
							if (confirmation) {
								this._dismiss('closed');
							}
						});
				})
			)
			.subscribe();
	}

	private _dismiss(...args: any[]) {
		this._dialogRef.close(...args);
	}

	processEndReachedEvent() {
		if (this.data.closeWithoutConfirmation) {
			this._dismiss();
			return;
		}
		this.notificationsService
			.confirm(
				this.data.closingMessage ?? 'Conversation is over and will be closed.',
				undefined,
				'Stay here',
				'Close interview'
			)
			.subscribe((confirmation) => {
				if (confirmation) {
					this._dismiss('completed');
				}
			});
	}
}
