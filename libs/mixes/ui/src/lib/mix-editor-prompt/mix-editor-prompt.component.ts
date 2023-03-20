import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Form, Mix, RecordingSessionListItem } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { FormsAsSourceComponent } from '@rumble-pwa/player/sources';
import { UsersRepository } from '@rumble-pwa/users/state';
import { DataObsViaId } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

interface MixDetails {
	mix?: Mix;
	goToDashboardAfter?: boolean;
	recordingSessionListItem?: RecordingSessionListItem;
	newMixName?: string;
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-mix-editor-prompt',
	templateUrl: './mix-editor-prompt.component.html',
	styleUrls: ['./mix-editor-prompt.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		FormsAsSourceComponent,
		FormsModule,
		MatFormFieldModule,
		ReactiveFormsModule,
		MatIconModule,
		MatButtonToggleModule,
		MatInputModule,
		MatButtonModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixEditorPromptComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	mixForm: FormGroup;
	forms: Form[] = [];

	displayArchivedSessions$$ = new BehaviorSubject<boolean>(false);

	@ViewChild('formAsSource') formAsSource?: FormsAsSourceComponent;

	recordingSessions$$$ = new DataObsViaId(
		(formId: string) =>
			this.displayArchivedSessions$$.pipe(
				switchMap((includeArchived: boolean) => {
					return this._recordingSessionsManagementService.getFormSessions$(formId, includeArchived);
				}),
				switchMap((recordingSessions) => {
					return combineLatest(
						recordingSessions.map((recordingSession) =>
							this._recordingSessionsManagementService.getRecordingSessionListItem$(recordingSession.id)
						)
					);
				}),
				map((recordingSessionItems) => {
					return recordingSessionItems.filter((child): child is RecordingSessionListItem => !!child);
				}),
				debounceTime(100)
			),
		this._recordingSessionsManagementService
	);

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		@Inject(MAT_DIALOG_DATA)
		public data: MixDetails,
		private _dialogRef: MatDialogRef<MixEditorPromptComponent>,
		private _router: Router,
		private _notificationsService: NotificationsService,
		private _formBuilder: FormBuilder,
		private _formsManagementService: FormsManagementService,
		private _usersRepository: UsersRepository,
		private _recordingSessionsManagementService: RecordingSessionsManagementService,
		private _mixesManagementService: MixesManagementService
	) {
		super(_cdr, _layoutService, _activatedRoute);

		combineLatest([
			this._formsManagementService.forms$$,
			this._usersRepository.connectedUser$$,
			this._formsManagementService.sharedForms$,
		])
			.pipe(
				untilDestroyed(this),
				tap(([forms, profile, sharedForms]) => {
					const formsOwned = forms.filter((form) => form.ownerId === profile?.id);
					const sharedFormsFiltered = sharedForms.filter(
						(sharedForm) => !formsOwned.some((formOwned) => formOwned.id === sharedForm.id)
					);
					this.forms = sortBy([...formsOwned, ...sharedFormsFiltered], ['timeUpdate']).reverse();
					this._check();
				})
			)
			.subscribe();

		const now = new Date();

		this.mixForm = this._formBuilder.group({
			name: new FormControl(
				this.data?.newMixName ?? this.data.mix?.name ?? 'Mix of the day ' + now.toLocaleDateString(),
				[Validators.required]
			),
			description: new FormControl(this.data.mix?.description || ''),
			fillWithAForm: new FormControl(!!this.data.recordingSessionListItem),
		});
	}

	save() {
		if (this.mixForm.invalid) {
			this.mixForm.get('name')?.markAsDirty();
			return;
		}
		if (this.data.mix) {
			const updatedMix: Partial<Mix> = {
				name: this.mixForm.value.name,
				description: this.mixForm.value.description,
			};
			this._mixesManagementService.update(this.data.mix.id, updatedMix);
			this.dismiss();
		} else {
			this._createMix();
		}
	}

	dismiss() {
		this._dialogRef.close();
	}

	private _createMix() {
		const newMixId = uuidv4();
		const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!ownerId) return;

		const virtualPlaylist = this.formAsSource?.state?.virtualPlaylist;
		if (virtualPlaylist) virtualPlaylist.id = newMixId + '-' + newMixId;

		const newMix: Mix = {
			id: newMixId,
			ownerId,
			name: this.mixForm.value.name,
			description: this.mixForm.value.name,
			data2: JSON.stringify({ virtualPlaylist }),
		};

		this._mixesManagementService.add(newMix);

		if (this.data.goToDashboardAfter) {
			this._router.navigate(['/dashboard']);
			this.dismiss();
		} else {
			this._router.navigate(['/mixes/' + newMixId]);
			this.dismiss();
		}
	}
}
