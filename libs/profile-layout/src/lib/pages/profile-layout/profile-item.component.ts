import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ImageComponent } from '@rumble-pwa/atomic-system';
import { AuthTokensRepository } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { EntityFile } from '@rumble-pwa/files/models';
import { FileUploadService } from '@rumble-pwa/files/services';
import { FilesRepository } from '@rumble-pwa/files/state';
import { scopeLoader } from '@rumble-pwa/i18n';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectThumbnail } from '@rumble-pwa/objects/models';
import { ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { User, UserData } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import jwt_decode from 'jwt-decode';
import { of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-profile-item',
	templateUrl: './profile-item.component.html',
	styleUrls: ['./profile-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		CommonModule,
		MatFormFieldModule,
		ImageComponent,
		MatIconModule,
		RouterModule,
		MatButtonModule,
		TrackClickDirective,
		MatCheckboxModule,
		TranslocoModule,
	],
	providers: [
		{
			provide: TRANSLOCO_SCOPE,
			useValue: {
				// this 2 lines are basically
				// saying "please load the json file into ABC namespace."
				// HTML will need to use at least "profileLayout." to use its content.
				scope: 'profileLayout',
				loader: scopeLoader((lang: string) => {
					return import(`../../i18n/${lang}.json`);
				}),
			},
		},
	],
})
export class ProfileItemComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged, OnInit {
	profile: User | null = null;

	profileData: UserData | null = null;

	public profilePictureThumbnail: ObjectThumbnail<EntityFile> | undefined = undefined;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private activatedRoute: ActivatedRoute,
		private _usersRepository: UsersRepository,
		public filesRepository: FilesRepository,
		public router: Router,
		private notificationsService: NotificationsService,
		private _layoutRepository: LayoutRepository,
		private _fileUploadService: FileUploadService,
		private _objectPromptService: ObjectPromptService,
		private _authTokensRepository: AuthTokensRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// get profile from local store

		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				switchMap((profile) => {
					this.profile = profile;
					const defaultProfileData: UserData = {};
					this.profileData = this.profile?.data ? JSON.parse(this.profile.data) : defaultProfileData;

					return of(this._usersRepository.getUserAvatar(profile));
				}),
				switchMap((profilePictureUri) => this.filesRepository.convertURIToObjectThumbnail$(profilePictureUri)),
				tap((profilePictureThumbnail) => {
					this.profilePictureThumbnail = profilePictureThumbnail;
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
					title: 'Profile',
					link: undefined,
				},
			],
		});
	}

	ngOnInit() {
		const orderParam = this.activatedRoute.snapshot.queryParamMap.get('order');
		if (orderParam && orderParam === 'resetPassword') {
			this.openChangePasswordPrompt();
			this.notificationsService.warning('Please set a new password', 'password', undefined, undefined, 20000);
		}
	}

	/**
	 * Open the object prompt to edit the email
	 */
	public openChangeEmailPrompt(options?: { modalTitle?: string; modalSubmitText?: string }) {
		type EmailChange = {
			newEmail?: string;
			currentEmail?: string;
		};

		const profile = this.profile;
		if (!profile) return;

		this._objectPromptService
			.openObjectPromptModal$<EmailChange>({
				modalTitle: options?.modalTitle ?? 'Edit your email address',
				modalSubmitText: options?.modalSubmitText ?? 'Change',
				attributes: [
					{
						name: 'currentEmail',
						attributeType: 'displayText',
						HTMLlabel: 'Current email: ' + profile.email,
					},
					{
						name: 'newEmail',
						HTMLlabel: 'New Email',
						HTMLInputSubtype: 'email',
						validators: [Validators.email],
						required: true,
						callBack: (newEmailValue, promptComponent) => {
							const emailControl = promptComponent.attributeForm.get('newEmail');
							if (!emailControl) return;
							const currentErrors = emailControl.errors;
							if (newEmailValue === profile.email) {
								const errors = {
									...currentErrors,
									sameValue: {
										message: 'This is the same email',
									},
								};
								emailControl.setErrors(errors);
							} else {
								emailControl.setErrors(currentErrors);
							}
							promptComponent._check();
						},
					},
				],
			})
			.pipe(
				untilDestroyed(this),
				map((result: Partial<EmailChange> | undefined) => {
					if (!result || !result.newEmail) return;
					this._usersRepository.changeConnectedUserEmail(result.newEmail);
				})
			)
			.subscribe();
	}

	/** Update the user names (first, display and last)
	 * subscribes to the changes on those names and updates the user
	 * @returns Subscription
	 */
	public updateProfile() {
		if (!this.profile) return;
		return this._objectPromptService
			.openObjectPromptModal$<User>({
				modalTitle: 'Profile',
				modalSubmitText: 'Save',
				objectId: this.profile.id,
				object: this.profile,
				attributes: [
					{
						name: 'fullName',
						HTMLlabel: 'Display name',
						defaultValue: '',
						required: true,
					},
					{
						name: 'firstName',
						HTMLlabel: 'First name',
						defaultValue: '',
						required: false,
					},
					{
						name: 'lastName',
						HTMLlabel: 'Last name',
						defaultValue: '',
						required: false,
					},
					{
						name: 'newsletterSubscribed',
						attributeType: 'checkbox',
						defaultValue: false,
						required: false,
						HTMLlabel: 'I want to receive the latest news and updates from Rumble Studio.',
					},
				],
			})
			.pipe(
				tap((user) => {
					if (user && this.profile) {
						this._usersRepository.updateUser(this.profile.id, user);
					}
				})
			)
			.subscribe();
	}

	sendValidationEmail() {
		if (!this.profile) return;
		this._usersRepository.sendEmailValidation(this.profile.email);
	}

	// acceptNewTou() {
	// 	this.usersRepository.updateNewTou(true);
	// }

	/**
	 * Open the object prompt to edit the password
	 */
	public openChangePasswordPrompt(options?: { modalTitle?: string; modalSubmitText?: string }) {
		type PasswordChange = {
			oldPassword?: string;
			userPassword?: string;
			userPasswordConfirm?: string;
		};

		const hasPassword = this._usersRepository.connectedUser$$.getValue()?.hasPassword ?? false;
		const authToken = this._authTokensRepository.getCurrentAuthToken();
		const decodedToken: { [key: string]: string | number | boolean } = authToken ? jwt_decode(authToken) : {};
		const at = decodedToken?.at ? (decodedToken?.at as number) : 0;
		const allowPasswordChange = decodedToken?.allowPasswordChange ? (decodedToken.allowPasswordChange as boolean) : false;
		const delta = (Math.round(Date.now() / 1000) - at) / 60;

		const askForOldPassword = !(allowPasswordChange && delta < 10) && hasPassword;

		console.log({
			hasPassword,
			authToken,
			decodedToken,
			at,
			allowPasswordChange,
			delta,
			askForOldPassword,
		});

		const modalTitle = hasPassword ? 'Change your password' : 'Set your password';

		this._objectPromptService
			.openObjectPromptModal$<PasswordChange>({
				modalTitle: options?.modalTitle ?? modalTitle,
				modalSubmitText: options?.modalSubmitText ?? 'Save',
				object: {},
				attributes: [
					{
						name: 'oldPassword',
						HTMLlabel: 'Old Password',
						HTMLInputSubtype: 'password',
						hidden: !askForOldPassword,
						required: true,
					},
					{
						name: 'userPassword',
						HTMLlabel: 'New Password',
						HTMLInputSubtype: 'password',
						validators: [Validators.minLength(8), Validators.maxLength(60)],
						required: true,
						callBackPipeProperties: {
							debounceTime: 300,
						},
						callBack: (newUserPassword, promptComponent) => {
							const userPasswordConfirmControl = promptComponent.attributeForm.get('userPasswordConfirm');

							if (userPasswordConfirmControl?.value !== newUserPassword && userPasswordConfirmControl?.touched) {
								const errors = {
									confirmationDoesNotMatch: {
										message: 'The confirmation is not matching your new password.',
									},
								};
								userPasswordConfirmControl?.setErrors(errors);
							} else {
								userPasswordConfirmControl?.setErrors(null);
							}
							promptComponent._check();
						},
					},
					{
						name: 'userPasswordConfirm',
						HTMLlabel: 'Confirm Password',
						HTMLInputSubtype: 'password',
						callBackPipeProperties: {
							debounceTime: 300,
						},
						callBack: (newUserPasswordConfirm, promptComponent) => {
							const userPasswordControl = promptComponent.attributeForm.get('userPassword');
							const userPasswordConfirmControl = promptComponent.attributeForm.get('userPasswordConfirm');

							if (userPasswordControl?.value !== newUserPasswordConfirm) {
								const errors = {
									confirmationDoesNotMatch: {
										message: 'The confirmation is not matching your new password.',
									},
								};
								userPasswordConfirmControl?.setErrors(errors);
								promptComponent._check();
							}
						},
					},
				],
				onSubmit: (promptComponent) => {
					// Used here because of the debouceTime of 1000ms, user could submit a -not yet- invalid form
					// Therefore we need to check validity immediately on submit
					const userPasswordControl = promptComponent.attributeForm.get('userPassword');
					const userPasswordConfirmControl = promptComponent.attributeForm.get('userPasswordConfirm');

					if (
						userPasswordConfirmControl?.value !== userPasswordControl?.value &&
						userPasswordConfirmControl?.touched
					) {
						const errors = {
							confirmationDoesNotMatch: {
								message: 'The confirmation is not matching your new password.',
							},
						};
						userPasswordConfirmControl?.setErrors(errors);
					} else {
						userPasswordConfirmControl?.setErrors(null);
					}
				},
			})
			.pipe(
				untilDestroyed(this),
				map((result: Partial<PasswordChange> | undefined) => {
					if (!result) return;
					if (askForOldPassword && !result.oldPassword) {
						console.warn('You must enter the old password');
						return;
					}
					if (!result.userPassword) {
						console.warn('You must enter a new password');
						return;
					}
					if (result.userPassword != result.userPasswordConfirm) {
						console.warn('Your confirmation does not match.');
						return;
					}

					this._usersRepository.changePassword(result.userPassword, result.oldPassword);
				})
			)
			.subscribe();
	}

	public removeAvatar() {
		this.notificationsService
			.confirm('Remove profile picture', 'Are you sure to remove your profile picture?', 'Cancel', 'Remove')
			.subscribe((confirm) => {
				if (confirm) {
					this._usersRepository.addDataToConnectedUser({
						profilePictureUrl: null,
					});
				}
			});
	}
	public updateAvatar() {
		this._fileUploadService
			.getNewImages$(1)
			.pipe(
				untilDestroyed(this),
				tap((r) => {
					if (r && r.length > 0) {
						const imageEntityFile = r[0].object;
						if (imageEntityFile) {
							this._usersRepository.addDataToConnectedUser({
								profilePictureUrl: 'rs://' + imageEntityFile.id,
							});
						}
					}
				})
			)
			.subscribe();
	}

	public launchKYCForm(update: boolean = false) {
		this._usersRepository.launchKYCForm(update);
	}
}
