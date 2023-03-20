import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	ViewChild,
} from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '@rumble-pwa/auth-system';
import { LoadingService } from '@rumble-pwa/loading';
import { getRouteQueryParam$ } from '@rumble-pwa/utils';
import { merge, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-pro-register-form',
	templateUrl: './pro-register-form.component.html',
	styleUrls: ['./pro-register-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProRegisterFormComponent implements AfterViewInit {
	@ViewChild('inputFirstName') inputFirstName?: ElementRef<HTMLInputElement>;

	triggerValidators$: ReplaySubject<boolean> = new ReplaySubject();

	registerFormGroup: UntypedFormGroup;

	registerFormDisabled = false;

	_loading = false;
	get loading() {
		return this._loading;
	}
	set loading(loading: boolean) {
		this._loading = loading;
		loading ? this.loadingService.load() : this.loadingService.stop();
	}

	// _connected = false;
	// get connected() {
	// 	return this._connected;
	// }
	// set connected(connected: boolean) {
	// 	if (connected != this._connected) {
	// 		this._connected = connected;
	// 	}

	// 	if (connected) {
	// 		const redirectUrl = this.activatedRoute.snapshot.queryParams['redirectUrl'] || '/';
	// 		this.authService.consumeRedirectCache('proregisterform', redirectUrl);
	// 		// this.router.navigate([redirectUrl.replace('%3F', '?')]);
	// 	}
	// }

	private _defaultEmail?: string;
	@Input()
	public set defaultEmail(value: string | undefined) {
		this._defaultEmail = value;
		if (value) {
			this.registerFormGroup.patchValue({ email: value });
		}
	}
	public get defaultEmail(): string | undefined {
		return this._defaultEmail;
	}

	@Output() emailEvent = new EventEmitter<string>();

	companySizeSelect = [
		{
			value: '1',
			viewValue: '1',
		},
		{
			value: '2-10',
			viewValue: 'Between 2 and 10',
		},
		{
			value: '11-50',
			viewValue: 'Between 11 and 50',
		},
		{
			value: '51-100',
			viewValue: 'Between 51 and 100',
		},
		{
			value: '100-500',
			viewValue: 'Between 100 and 500',
		},
		{
			value: '501-1000',
			viewValue: 'Between 501 and 1000',
		},
		{
			value: '1000+',
			viewValue: 'More than 1000',
		},
	];

	usageSelect = [
		{
			value: 'podcast',
			viewValue: 'Podcast show(s)',
		},
		{
			value: 'internal',
			viewValue: 'Internal communication',
		},
		{
			value: 'surveys',
			viewValue: 'Surveys',
		},
		{
			value: 'testimonials',
			viewValue: 'Testimonials',
		},
		{
			value: 'other',
			viewValue: 'Other',
		},
	];

	constructor(
		private authService: AuthService,
		private formBuilder: UntypedFormBuilder,
		private loadingService: LoadingService,
		private cdr: ChangeDetectorRef,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		// /**
		//  * Connected state
		//  */
		// this._usersRepository.isConnected$$.pipe(untilDestroyed(this)).subscribe((isLoggedIn) => {
		// 	this.connected = isLoggedIn;
		// 	this._check();
		// });

		this.registerFormGroup = this.formBuilder.group({
			firstName: new UntypedFormControl('', {
				updateOn: 'change',
			}),
			lastName: new UntypedFormControl('', {
				updateOn: 'change',
			}),
			email: new UntypedFormControl('', {
				updateOn: 'change',
			}),
			password: new UntypedFormControl('', {
				updateOn: 'change',
			}),
			companySize: new UntypedFormControl('', {
				updateOn: 'change',
			}),
			usage: new UntypedFormControl('', {
				updateOn: 'change',
			}),
			phoneNumber: new UntypedFormControl('', {
				updateOn: 'change',
			}),
			touAccepted: new UntypedFormControl(false, {
				updateOn: 'change',
			}),
			newsletterSubscribed: new UntypedFormControl(false, {
				updateOn: 'change',
			}),
		});

		this._check();

		const password = this.registerFormGroup.get('password') as AbstractControl;

		merge(this.triggerValidators$, password.valueChanges).subscribe(() => {
			const errors = {
				...Validators.minLength(8)(password),
				...Validators.maxLength(60)(password),
				...Validators.required(password),
			};
			if (Object.keys(errors).length > 0) {
				password.setErrors(errors);
				//this.registerFormDisabled = true;
			}
			this._check();
		});

		const email = this.registerFormGroup.get('email') as AbstractControl;

		merge(this.triggerValidators$, email.valueChanges)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				const errors = {
					...Validators.email(email),
					...Validators.required(email),
				};
				if (Object.keys(errors).length > 0) {
					email.setErrors(errors);

					////this.registerFormDisabled = true;
				}
				this._check();
			});

		// const firstName = this.registerFormGroup.get('firstName') as AbstractControl;

		// merge(this.triggerValidators$, firstName.valueChanges).subscribe(() => {
		//   const errors = {
		//     ...Validators.required(firstName),
		//   };
		//   if (Object.keys(errors).length > 0) {
		//     firstName.setErrors(errors);

		//     ////this.registerFormDisabled = true;
		//   }
		//   this.check();
		// });

		// const lastName = this.registerFormGroup.get('lastName') as AbstractControl;

		// merge(this.triggerValidators$, lastName.valueChanges).subscribe(() => {
		//   const errors = {
		//     ...Validators.required(lastName),
		//   };
		//   if (Object.keys(errors).length > 0) {
		//     lastName.setErrors(errors);
		//     //this.registerFormDisabled = true;
		//   }
		//   this.check();
		// });

		// const companySize = this.registerFormGroup.get('companySize') as AbstractControl;

		// merge(this.triggerValidators$, companySize.valueChanges).subscribe(() => {
		//   const errors = {
		//     ...Validators.required(companySize),
		//   };
		//   if (Object.keys(errors).length > 0) {
		//     companySize.setErrors(errors);
		//     //this.registerFormDisabled = true;
		//   }
		//   this.check();
		// });

		// const usage = this.registerFormGroup.get('usage') as AbstractControl;

		// merge(this.triggerValidators$, usage.valueChanges).subscribe(() => {
		//   const errors = {
		//     ...Validators.required(usage),
		//   };
		//   if (Object.keys(errors).length > 0) {
		//     usage.setErrors(errors);

		//     //this.registerFormDisabled = true;
		//   }
		//   this.check();
		// });

		// const phoneNumber = this.registerFormGroup.get('phoneNumber') as AbstractControl;

		// merge(this.triggerValidators$, phoneNumber.valueChanges).subscribe(() => {
		//   const errors = {
		//     ...Validators.required(phoneNumber),
		//   };
		//   if (Object.keys(errors).length > 0) {
		//     phoneNumber.setErrors(errors);

		//     //this.registerFormDisabled = true;
		//   }
		//   this.check();
		// });

		const touAccepted = this.registerFormGroup.get('touAccepted') as AbstractControl;
		merge(this.triggerValidators$, touAccepted.valueChanges)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				const errors = {
					...Validators.requiredTrue(touAccepted),
				};
				if (Object.keys(errors).length > 0) {
					touAccepted.setErrors(errors);

					//this.registerFormDisabled = true;
				}
				this._check();
			});

		// this.triggerValidators$.subscribe(() => {
		//   console.log('trigger validators (constructor)');
		// });

		getRouteQueryParam$(this.activatedRoute, 'email')
			.pipe(
				untilDestroyed(this),
				tap((emailInQuery) => {
					if (emailInQuery) {
						email.patchValue(emailInQuery);
						this._check();
					}
				})
			)
			.subscribe();

		this.registerFormGroup
			.get('email')
			?.valueChanges.pipe(untilDestroyed(this))
			.subscribe((email) => {
				if (email) {
					this.emailEvent.emit(email);
				}
			});
	}
	ngAfterViewInit() {
		if (this.inputFirstName) {
			this.inputFirstName.nativeElement.focus();
		}
	}

	private _check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}

	onSubmit() {
		this.loading = true;
		this.triggerValidators$.next(true);

		const firstName = this.registerFormGroup.value.firstName;
		const lastName = this.registerFormGroup.value.lastName;
		const email = this.registerFormGroup.value.email;
		const password = this.registerFormGroup.value.password;
		const companySize = this.registerFormGroup.value.companySize;
		const usage = this.registerFormGroup.value.usage;
		const touAccepted = this.registerFormGroup.value.touAccepted;
		const phoneNumber = this.registerFormGroup.value.phoneNumber;
		const newsletterSubscribed = this.registerFormGroup.value.newsletterSubscribed;

		// console.log({
		//   firstName,
		//   lastName,
		//   email,
		//   password,
		//   companySize,
		//   usage,
		//   touAccepted,
		//   phoneNumber,
		//   newsletterSubscribed,
		// });

		if (this.registerFormGroup.invalid) {
			this.loading = false;
			return;
		}

		if (
			!email ||
			!password ||
			// !firstName ||
			// !lastName ||
			// !companySize ||
			// !usage ||
			// !usage ||
			// !phoneNumber ||
			// !newsletterSubscribed ||
			!touAccepted
		) {
			this.loading = false;
			return;
		}

		this.authService
			.registerPro({
				firstName,
				lastName,
				email,
				password,
				companySize,
				usage,
				touAccepted,
				phoneNumber,
				newsletterSubscribed,
				directRegistration: true,
				notifyAdminTeam: true,
			})
			.subscribe(() => {
				this.loading = false;
				this._check();
			});
	}
}
