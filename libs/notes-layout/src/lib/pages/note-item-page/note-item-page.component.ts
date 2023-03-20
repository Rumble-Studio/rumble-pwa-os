import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Note } from '@rumble-pwa/mega-store';
import { NotesManagementService } from '@rumble-pwa/notes-system';
import { DataObsViaId, getRouteParam$ } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { MatMenuTrigger } from '@angular/material/menu';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-note-item-page',
	templateUrl: './note-item-page.component.html',
	styleUrls: ['./note-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteItemPageComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	note$$$ = new DataObsViaId<Note>((noteId: string) => this.notesManagementService.get$(noteId));

	notes: Note[] = [];

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private notesManagementService: NotesManagementService,
		private dialog: MatDialog,
		private _layoutRepository: LayoutRepository,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		getRouteParam$(this._activatedRoute, 'noteId')
			.pipe(
				untilDestroyed(this),
				tap((noteId) => {
					this.note$$$.id = noteId;
					this._check();
				})
			)
			.subscribe();
		// get all notes for top list
		this.notesManagementService
			.getAll$()
			.pipe(
				untilDestroyed(this),
				tap((notes) => {
					this.notes = notes;
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.note$$$.$.pipe(
			untilDestroyed(this),
			tap((note) => {
				if (note) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Notes',
								link: '/notes',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-notes-menu',
							},
							{
								title: note.title + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-note-editor',
								tooltip: 'Edit note properties',
							},
						],
					});
				}
			})
		).subscribe();

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'open-note-editor') {
						this.editNote();
					} else if (event === 'display-other-notes-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	editNote() {
		console.warn('Not implemented');
	}

	selectNote(noteId: string) {
		this._router.navigate(['/dashboard', 'notes', noteId]);
	}
}
