import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { Note } from '@rumble-pwa/mega-store';
import { NotesManagementService } from '@rumble-pwa/notes-system';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-notes-list-page',
	templateUrl: './notes-list-page.component.html',
	styleUrls: ['./notes-list-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesListPageComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	notes: Note[] = [];

	private _displayArchivedNotes$$ = new BehaviorSubject(false);
	public get displayArchivedNotes() {
		return this._displayArchivedNotes$$.value;
	}
	public set displayArchivedNotes(value) {
		this._displayArchivedNotes$$.next(value);
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _router: Router,
		private _notesManagementService: NotesManagementService,
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		public dialog: MatDialog,
		private _layoutRepository: LayoutRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// TODO: not implemented
		// combineLatest([this._notesManagementService.notes$$, this._displayArchivedNotes$$, this._usersRepository.getUserId$()])
		// 	.pipe(
		// 		untilDestroyed(this),
		// 		tap(([notes, displayArchivedNotes, userId]) => {
		// 			this.notes = [
		// 				...notes
		// 					.filter((note) => note.ownerId === userId)
		// 					.filter((note) => (note.state === 'archived' && displayArchivedNotes) || note.state !== 'archived'),
		// 			];
		// 			this._check();
		// 		})
		// 	)
		// 	.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Notes',
					link: undefined,
				},
			],
		});
	}

	openDialog(note?: Note) {
		console.warn('Not implemented');
	}

	duplicateNoteWithConfirmation(note: Note) {
		this._notificationsService
			.confirm('Duplicate ' + note.title + '?')
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						this.duplicateNote(note);
					}
				})
			)
			.subscribe();
	}

	duplicateNote(note: Note) {
		if (this._debug) console.log('duplicateForm NOTE', note);

		const now = Math.round(Date.now() / 1000);

		// 1 duplicate the note itself
		const newNote: Note = {
			...note,
			id: uuidv4(),
			title: `${note.title} (copy)`,
			timeUpdate: now,
			timeCreation: now,
		};
		this._notesManagementService.add(newNote);
		this._check();
	}

	archiveNote(note: Note) {
		this._notificationsService
			.confirm()
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						this._notesManagementService.archive(note.id);
						this._check();
					}
				})
			)
			.subscribe();
	}

	restoreNote(note: Note) {
		this._notesManagementService.restore(note.id);
		this._notificationsService.success('Your note has been restored');
		this._check();
	}

	deleteNote(note: Note) {
		this._notificationsService
			.confirm()
			.pipe(
				untilDestroyed(this),
				tap((result) => {
					if (result) {
						this._notesManagementService.delete(note.id);
						this._check();
					}
				})
			)
			.subscribe();
	}

	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate([tableClickEvent.object.id], { relativeTo: this._activatedRoute });
	}
}
