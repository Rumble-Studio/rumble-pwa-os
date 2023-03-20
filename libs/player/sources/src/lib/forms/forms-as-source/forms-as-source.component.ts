import { COMMA, ENTER, SEMICOLON, TAB } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Form, RecordingSessionListItem } from '@rumble-pwa/mega-store';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { VirtualPlayerService, VirtualPlaylistWithStreamStates, VirtualTrack } from '@rumble-pwa/player/services';
import { VirtualPlaylistComponent } from '@rumble-pwa/player/ui';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { DataObsViaId, useObsUntilDestroyed } from '@rumble-pwa/utils';
import { cloneDeep, sortBy } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';

const formAsSourceIdPrefix = 'fas-';

interface FormWithNumberOfRecordingSessions extends Form {
	numberOfRecordingSessions: number;
}

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-forms-as-source',
	templateUrl: './forms-as-source.component.html',
	styleUrls: ['./forms-as-source.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatFormFieldModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatChipsModule,
		MatIconModule,
		MatAutocompleteModule,
		MatSelectModule,
		GroupItemGenericComponent,
		VirtualPlaylistComponent,
		RouterModule,
		MatSlideToggleModule,
		MatTooltipModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormsAsSourceComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, AfterViewInit
{
	private _selectedForm: FormWithNumberOfRecordingSessions | undefined;
	public get selectedForm() {
		return this._selectedForm;
	}
	public set selectedForm(value) {
		this._selectedForm = value;
		this.formId = value?.id;
	}
	/** Display add all btn */
	@Input() displayAddAllBtn = false;

	@Input() connectDropTo: string[] = [];

	searchableForms: FormWithNumberOfRecordingSessions[] = [];

	formSelectionCtrl = new UntypedFormControl();

	separatorKeysCodes: number[] = [ENTER, COMMA, TAB, SEMICOLON];

	_state: VirtualPlaylistWithStreamStates | null = null;
	public set state(newState) {
		this._state = newState;
		this.selectedRecordingSessionHasTracks = (newState?.virtualPlaylist.virtualTracks.length || 0) > 0;
		this._check();
	}
	public get state() {
		return this._state;
	}

	selectedRecordingSessionHasTracks = false;
	recordingSessionsListItems: RecordingSessionListItem[] = [];
	public selectedRecordingSessionsListItems: RecordingSessionListItem[] = []; // for select trigger display

	private selectedRecordedSessionIds$$ = new BehaviorSubject<string[]>([]);
	public set selectedRecordedSessionIds(value: string[]) {
		// if (isEqual(this.selectedRecordedSessionIds$$.value, value)) return;
		this.selectedRecordedSessionIds$$.next(value);
		this.selectedRecordingSessionsListItems = this.recordingSessionsListItems.filter((recordingSessionListItem) =>
			value.includes(recordingSessionListItem.recordingSession.id)
		);
	}
	public get selectedRecordedSessionIds(): string[] {
		return this.selectedRecordedSessionIds$$.value;
	}

	form$$$: DataObsViaId<Form> = new DataObsViaId<Form>((formId: string) => this._formsManagementService.get$(formId));
	public set formId(newFormId: string | undefined) {
		this.form$$$.id = newFormId;
	}
	public get formId(): string | undefined {
		return this.form$$$.id;
	}

	@Output() virtualTracksEmitter: EventEmitter<VirtualTrack[]> = new EventEmitter();

	private _recordingSessionListItem?: RecordingSessionListItem;
	public get recordingSessionListItem() {
		return this._recordingSessionListItem;
	}
	@Input()
	public set recordingSessionListItem(newRecordingSessionListItem) {
		this._recordingSessionListItem = newRecordingSessionListItem;
	}

	profile: User | null = null;

	@Input()
	hideAnswersWithoutAudioToggle = true;

	displaySessionsWithAudioOnly$$ = new BehaviorSubject<boolean>(false);
	public get displaySessionsWithAudioOnly() {
		return this.displaySessionsWithAudioOnly$$.getValue();
	}
	public set displaySessionsWithAudioOnly(value) {
		this.displaySessionsWithAudioOnly$$.next(value);
	}

	@ViewChild('formTemplatePreviewTpl') formTemplatePreviewTpl?: TemplateRef<HTMLElement>;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _formsManagementService: FormsManagementService,
		private _recordingSessionsManagementService: RecordingSessionsManagementService,
		private _virtualPlayerService: VirtualPlayerService,
		private _usersRepository: UsersRepository,
		private _notificationsService: NotificationsService,
		private _amplitudeService: AmplitudeService,
		private _router: Router,
		private _dialog: MatDialog
	) {
		super(_cdr, _layoutService, _activatedRoute);
		useObsUntilDestroyed(this._usersRepository.connectedUser$$, (p) => (this.profile = p), this);

		// get all owned forms
		combineLatest([
			this._formsManagementService.forms$$,
			this._usersRepository.connectedUser$$,
			this._formsManagementService.sharedForms$,
		])
			.pipe(
				untilDestroyed(this),
				switchMap(([forms, profile, sharedForms]) => {
					const formsOwned = forms.filter((form) => form.ownerId === profile?.id);
					const sharedFormsFiltered = sharedForms.filter(
						(sharedForm) => !formsOwned.some((formOwned) => formOwned.id === sharedForm.id)
					);
					const allForms = [...formsOwned, ...sharedFormsFiltered].filter(
						(formOwned) => !['deleted', 'archived'].includes(formOwned.state ?? 'default')
					);

					const formsWithRecordingSessions$: Observable<FormWithNumberOfRecordingSessions>[] = allForms.map(
						(form) => {
							const formWithNumberOfRecordingSessions$ = this._recordingSessionsManagementService
								.getFormSessions$(form.id)
								.pipe(
									map((recordingSessions) => {
										const formWithNumberOfRecordingSessions: FormWithNumberOfRecordingSessions = {
											...form,
											numberOfRecordingSessions: recordingSessions.length,
										};
										return formWithNumberOfRecordingSessions;
									})
								);
							return formWithNumberOfRecordingSessions$;
						}
					);
					return combineLatest(formsWithRecordingSessions$).pipe(startWith([]));
				}),
				tap((forms) => {
					this.searchableForms = sortBy(forms, ['timeUpdate']).reverse();
					this._check;
				})
			)
			.subscribe();

		// get recording sessions with guest details
		this.form$$$.$.pipe(
			untilDestroyed(this),
			switchMap((form) => {
				console.log('FAS Form', form);

				if (form) {
					return this._recordingSessionsManagementService.getFormSessions$(form.id);
				}
				return of([]);
			}),
			switchMap((recordingSessions) => {
				console.log('FAS recordingSessions', recordingSessions);
				// if (this._debug) {
				// }
				return combineLatest(
					recordingSessions.map((session) =>
						this._recordingSessionsManagementService.getRecordingSessionListItem$(session.id)
					)
				).pipe(startWith([] as (RecordingSessionListItem | null)[]));
			}),
			switchMap((recordingSessionItems) => {
				return this.displaySessionsWithAudioOnly$$.pipe(
					map((displaySessionsWithAudioOnly) => {
						return recordingSessionItems
							.filter((child): child is RecordingSessionListItem => !!child)
							.map((recordingSessionItem) => {
								const recordingSessionItemWithDuration: RecordingSessionListItem = {
									...recordingSessionItem,
									duration: this._recordingSessionsManagementService.getRecordingSessionDuration(
										recordingSessionItem.recordingSession.id
									),
								};
								return recordingSessionItemWithDuration;
							})
							.filter(
								(recordingSessionItem) =>
									(displaySessionsWithAudioOnly && recordingSessionItem.duration) ||
									!displaySessionsWithAudioOnly
							);
					})
				);
			}),

			map((recordingSessionsListItems) => {
				// if (this._debug) {
				console.log('FAS recordingSessionsListItems', recordingSessionsListItems);
				// }
				return recordingSessionsListItems.filter((session): session is RecordingSessionListItem => !!session);
			}),
			tap((recordingSessionsListItems) => {
				// update recording sessions list items
				this.recordingSessionsListItems = [...recordingSessionsListItems];
				if (recordingSessionsListItems.length > 0 && this.selectedRecordedSessionIds.length === 0) {
					console.log('no recording session selected, selecting first one');

					this.selectedRecordedSessionIds = [recordingSessionsListItems[0].recordingSession.id];
				} else if (recordingSessionsListItems.length === 0) {
					this.selectedRecordedSessionIds = [];
				}
				this._check();
			})
		).subscribe();

		// use selected recording sessions to upsert virtual playlist
		this.selectedRecordedSessionIds$$
			.pipe(
				untilDestroyed(this),
				switchMap((selectedRecordedSessionIds) => {
					if (this._debug) {
						console.log('%cFAS selectedRecordedSessionIds', 'color:green', selectedRecordedSessionIds);
					}
					if (selectedRecordedSessionIds.length === 0) {
						return of({
							virtualPlaylist: null,
							playlistSettings: null,
						});
					}
					if (this._debug) {
						console.log('%cFAS selectedRecordedSessionIds CONVERTING', 'color:green', selectedRecordedSessionIds);
					}
					return this._recordingSessionsManagementService.convertRecordingSessionsToVirtualPlaylistData$(
						selectedRecordedSessionIds,
						formAsSourceIdPrefix + this.formId
					);
				}),

				switchMap((virtualPlaylistData) => {
					if (this._debug) {
						console.log('%cFAS virtualPlaylistData', 'color:green', virtualPlaylistData);
					}
					if (!virtualPlaylistData.virtualPlaylist) {
						return of(null);
					}
					return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylistData.virtualPlaylist);
				}),
				tap((state) => {
					this.state = cloneDeep(state);
					if (this._debug) {
						console.log('%cstate in fas:', 'color:orange; font-weight:bold', state);
					}
					this._check();
				})
			)
			.subscribe();
	}

	ngAfterViewInit(): void {
		console.log('ngAfterViewInit');
		if (this.recordingSessionListItem) {
			// this.formSelectionCtrl.setValue(this.recordingSessionListItem.form);
			const formWithNumberOfRecordingSessions: FormWithNumberOfRecordingSessions = {
				...this.recordingSessionListItem.form,
				numberOfRecordingSessions: 1,
			};
			this.selectedForm = formWithNumberOfRecordingSessions;
			// this.formSelectionCtrl.setValue(null);
			this.selectedRecordedSessionIds = [this.recordingSessionListItem.recordingSession.id];
			console.log('%cFAS selected recording session', 'color:green', this.recordingSessionListItem);

			this._check();

			// this.formId = this.recordingSessionListItem.form.id;
		} else {
			console.log('%cFAS no recording session selected', 'color:red');
		}
	}

	public processClickTrackEvent(virtualTrack: VirtualTrack) {
		console.log('processClickTrackEvent', 'not implemented', virtualTrack);
	}

	//
	/**
	 * Used from the mix drawer when chosing a form for form-as-source
	 * @param event
	 */
	public selectForm(event: any) {
		this.selectedForm = event.option.value;
	}

	public removeForm() {
		this.selectedForm = undefined;
		this.formSelectionCtrl.setValue(null);
	}

	public addFormWithInput(): void {
		this._notificationsService.warning('Interview not found.');
	}

	emitVirtualTracks(virtualTracks: VirtualTrack[]) {
		this.virtualTracksEmitter.emit(virtualTracks);
	}

	emitAllVirtualTracks() {
		const virtualTracksToEmit = this.state?.virtualTrackWithStreamStates?.map(
			(virtualTrackWithStreamState) => virtualTrackWithStreamState.virtualTrack
		);
		if (!virtualTracksToEmit) return;
		if (virtualTracksToEmit.length === 1) {
			this.emitVirtualTracks(virtualTracksToEmit);
		} else {
			this._notificationsService
				.confirm(`Are you sure to insert ${virtualTracksToEmit.length} segments at the end of your current mix?`)
				.pipe(
					untilDestroyed(this),
					tap((confirm) => {
						if (confirm) {
							this.emitVirtualTracks(virtualTracksToEmit);
						}
					})
				)
				.subscribe();
		}
	}

	// Opens a pompt to create a form
	public createANewForm() {
		this._formsManagementService
			.openPromptEditor({
				modalTitle: 'Create a new interview',
				modalDescription: 'An interview is the first way to get audio from your guests.',
				modalSubmitText: 'Save',
			})
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						this._router.navigate(['/forms/editor/' + result.id]);
					}
				})
			)
			.subscribe();
	}
}
