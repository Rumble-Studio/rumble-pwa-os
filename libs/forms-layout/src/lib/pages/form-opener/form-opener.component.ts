import { ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MetaDataService } from '@rumble-pwa/atomic-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { LayoutRepository } from '@rumble-pwa/layout/state';
import { Form, FormData } from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	getRouteQueryParam$,
	HasLayoutSize,
	inIframe,
	LayoutService,
	LayoutSizeAndCheck,
	VisionService,
} from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-form-opener',
	templateUrl: './form-opener.component.html',
	styleUrls: ['./form-opener.component.scss'],
})
export class FormOpenerComponent extends LayoutSizeAndCheck implements CanCheck, CanBeDebugged, HasLayoutSize {
	providerId = 'default-participant';
	displayRumbleLogo = true;
	isOffline = false;
	isDeleted = false;

	form$$$ = new DataObsViaId<Form>((formId: string) => this.formsManagementService.get$(formId));

	profile: User | null = null;

	// steps$: Observable<Step[]>;
	// steps: Step[] = [];
	formIsLoading = true;
	stepId?: string;

	dataWasFetched = false;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private formsManagementService: FormsManagementService,
		public visionService: VisionService,
		public dialog: MatDialog,
		private notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _layoutRepository: LayoutRepository,
		private _metaDataService: MetaDataService,
		private _filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		selectPersistStateInit()
			.pipe(take(1))
			.subscribe(() => {
				// read param from route
				getRouteParam$(this._activatedRoute, 'formId')
					.pipe(
						untilDestroyed(this),
						tap((formId) => (this.form$$$.id = formId))
					)
					.subscribe();

				getRouteQueryParam$(this._activatedRoute, 'stepId')
					.pipe(
						untilDestroyed(this),
						tap((stepId) => {
							if (stepId) {
								this.stepId = stepId;
							}
						})
					)
					.subscribe();

				getRouteQueryParam$(this._activatedRoute, 'embedded')
					.pipe(
						untilDestroyed(this),
						tap((embedded) => {
							if (!!embedded && inIframe()) {
								this.displayRumbleLogo = false;
							}
						})
					)
					.subscribe();

				getRouteQueryParam$(this._activatedRoute, 'removeRumbleLogo')
					.pipe(
						untilDestroyed(this),
						tap((removeRumbleLogo) => {
							if (removeRumbleLogo) {
								this.displayRumbleLogo = false;
							}
						})
					)
					.subscribe();

				getRouteQueryParam$(this._activatedRoute, 'provider')
					.pipe(
						untilDestroyed(this),
						tap((providerId) => {
							if (providerId) {
								this.providerId = providerId;
							}
						})
					)
					.subscribe();

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

				// set the meta datas
				this.form$$$.$.pipe(
					untilDestroyed(this),
					tap((form: Form | undefined) => {
						// form from cnamed page should not overwrite meta datas
						const cnamed = !(
							window.location.origin.includes('localhost') || window.location.origin.includes('app.rumble.studio')
						);
						if (cnamed || !form) return;

						// Updating meta data from form
						this.updateMetaData(form);

						const data: FormData = JSON.parse(form.data || '{}');
						this.isOffline = data.isOffline ?? false;
						this.isDeleted = form.state === 'deleted';
					})
				).subscribe();

				this._usersRepository.connectedUser$$
					.pipe(
						untilDestroyed(this),
						tap((profile) => {
							this.profile = profile;
						})
					)
					.subscribe();
			});

		this._layoutRepository.setLayoutProps({
			displayHeader: false,
			displayBurgerMenu: false,
			displayFooter: false,
			displaySidebarLeft: false,
			loading: false,
			displayGlobalPlayer: false,
		});
	}

	/**
	 * Set the title
	 * @param form to set the tab title
	 */
	updateMetaData(form: Form) {
		if (form.title) this._metaDataService.setTitle(form.title);
	}
}
