import { ChangeDetectorRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormOpenerData, FormOpenerPromptComponent } from '@rumble-pwa/forms-layout';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { Form } from '@rumble-pwa/mega-store';
import { DEMO_FORM_ID } from '@rumble-pwa/profile-system';
import { UserData } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	HasLayoutSize,
	JavascriptService,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { of } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss'],
})
export class HelpComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	checkForDemoFormCalled = false;
	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activateRoute: ActivatedRoute,
		//
		private _javascriptService: JavascriptService,
		private _notificationsService: NotificationsService,
		private _layoutRepository: LayoutRepository,
		public dialog: MatDialog,
		// private _formsManagementService: FormsManagementService,
		private _usersRepository: UsersRepository,
		private injector: Injector
	) {
		super(_cdr, _layoutService, _activateRoute);
		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Help',
					link: undefined,
				},
			],
		});

		this._javascriptService.loadScript('hubspot-script', '//js-eu1.hs-scripts.com/24940985.js', () => {
			console.log('hubspot script loaded');
		});
	}

	openDemoInterview() {
		if (this.isMobile) {
			this._notificationsService.warning('You cannot open the demo interview on mobile.');
			return;
		}
		if (this.checkForDemoFormCalled) return;
		this.checkForDemoFormCalled = true;

		const _formsManagementService = this.injector.get(FormsManagementService);
		_formsManagementService
			.fetchFormData$(DEMO_FORM_ID)
			.pipe(
				switchMap(() => _formsManagementService.get$(DEMO_FORM_ID)),
				filter((form): form is Form => !!form),
				take(1),
				switchMap(() => {
					// to avoid multiple openning of the interview

					const data: FormOpenerData = {
						formId: DEMO_FORM_ID,
						confirmationMessage: 'You are leaving the demo interview.',
						closingMessage: 'You finished the demo interview.',
					};
					return this.dialog
						.open(FormOpenerPromptComponent, {
							height: '800px',
							maxHeight: '90%',
							minWidth: '300px',
							width: '800px',
							maxWidth: '90%',
							data,
						})
						.afterClosed();
				}),
				tap((afterCloseValue) => {
					console.log('afterCloseValue', afterCloseValue);
					const newData: UserData = {
						history: {
							formStateList: {
								[DEMO_FORM_ID]: {
									state: afterCloseValue ?? 'started',
								},
							},
						},
					};

					//As you can open this demo interview as many times as you want, we reset this security:
					this.checkForDemoFormCalled = false;

					console.log('newData', newData);

					// const newData: UserData = {
					// 	[INTERVIEW_TO_DISPLAY]: 'closed',
					// };
					this._usersRepository.addDataToConnectedUser(newData);
					// // add formId true to user data
				}),
				// catch 404 error
				catchError((error) => {
					console.error('Error while opening demo interview:', error);
					//As you can open this demo interview as many times as you want, we reset this security:
					this.checkForDemoFormCalled = false;

					return of(null);
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	processCopyToClipboardEvent(copied: boolean) {
		if (copied) {
			this._notificationsService.success('Content copied!', undefined, undefined, undefined, 1000);
		} else {
			this._notificationsService.error('Error while copying');
		}
	}
}
