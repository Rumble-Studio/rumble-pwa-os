import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { Form } from '@rumble-pwa/mega-store';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { sortBy } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-list-page',
	templateUrl: './form-list-page.component.html',
	styleUrls: ['./form-list-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormListPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	private displayArchivedForms$$ = new BehaviorSubject(false);
	public get displayArchivedForms() {
		return this.displayArchivedForms$$.value;
	}
	public set displayArchivedForms(value) {
		this.displayArchivedForms$$.next(value);
	}

	forms: Form[] = [];

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		private _router: Router,
		public dialog: MatDialog,
		private _formsManagementService: FormsManagementService,
		private _usersRepository: UsersRepository,
		private _layoutRepository: LayoutRepository
	) {
		super(_cdr, _layoutService, _activateRoute);

		// get all owned forms with shared forms
		combineLatest([
			this._formsManagementService.forms$$,
			this._usersRepository.connectedUser$$,
			this.displayArchivedForms$$,
			this._formsManagementService.sharedForms$.pipe(startWith([])),
		])
			.pipe(
				untilDestroyed(this),
				tap(([forms, profile, displayArchivedForms, sharedForms]) => {
					const formsOwned = forms.filter((form) => form.ownerId === profile?.id);
					const sharedFormsFiltered = sharedForms.filter(
						(sharedForm) => !formsOwned.some((formOwned) => formOwned.id === sharedForm.id)
					);
					this.forms = sortBy(
						[...formsOwned, ...sharedFormsFiltered].filter(
							(form) => (form.state === 'archived' && displayArchivedForms) || form.state !== 'archived'
						),
						['timeUpdate']
					).reverse();
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Interviews',
					link: undefined,
				},
			],
		});
	}

	// Opens a pompt to create a form
	openFormPromptEditor() {
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

	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		if (!tableClickEvent.object?.id) return;
		this._router.navigate(['editor/', tableClickEvent.object.id], { relativeTo: this._activatedRoute });
	}
}
