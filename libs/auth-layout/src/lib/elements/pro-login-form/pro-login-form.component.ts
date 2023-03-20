import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '@rumble-pwa/auth-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { getRouteQueryParam$ } from '@rumble-pwa/utils';
import { merge, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-pro-login-form',
	templateUrl: './pro-login-form.component.html',
	styleUrls: ['./pro-login-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProLoginFormComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged, OnInit {
	@ViewChild('inputEmail') inputEmail?: ElementRef<HTMLInputElement>;

	triggerValidators$: ReplaySubject<boolean> = new ReplaySubject();

	loginFormGroup: UntypedFormGroup;

	loginFormDisabled = false;

	private _defaultEmail?: string;
	@Input()
	public set defaultEmail(value: string | undefined) {
		this._defaultEmail = value;
		if (value) {
			this.loginFormGroup.patchValue({ email: value });
		}
	}
	public get defaultEmail(): string | undefined {
		return this._defaultEmail;
	}

	@Input() preventRedirect = false;
	@Output() leaveFormEvent = new EventEmitter();

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _authService: AuthService,
		private _formBuilder: FormBuilder,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this.loginFormGroup = this._formBuilder.group({
			email: new FormControl(this.defaultEmail || '', {
				updateOn: 'change',
			}),
			password: new FormControl('', {
				updateOn: 'change',
			}),
		});
	}

	ngOnInit(): void {
		if (this.inputEmail) {
			this.inputEmail.nativeElement.focus();
		}

		const password = this.loginFormGroup.controls.password;
		merge(this.triggerValidators$, password.valueChanges)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				const errors = {
					...Validators.minLength(8)(password),
					...Validators.maxLength(60)(password),
					...Validators.required(password),
				};
				if (Object.keys(errors).length > 0) {
					password.setErrors(errors);
					//this.loginFormDisabled = true;
				}
				this._check();
			});

		const email = this.loginFormGroup.controls.email;
		merge(this.triggerValidators$, email.valueChanges)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				const errors = {
					...Validators.email(email),
					...Validators.required(email),
				};
				if (Object.keys(errors).length > 0) {
					email.setErrors(errors);

					////this.loginFormDisabled = true;
				}
				this._check();
			});

		getRouteQueryParam$(this._activatedRoute, 'email')
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
	}

	onSubmit() {
		this.triggerValidators$.next(true);

		const email = this.loginFormGroup.value.email;
		const password = this.loginFormGroup.value.password;

		if (this.loginFormGroup.invalid) {
			return;
		}

		if (!email || !password) {
			return;
		}

		this._authService
			.login(email, password)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				this._check();
			});
	}

	goToResetPage() {
		this.leaveFormEvent.emit();
		this._router.navigate(['auth', 'password-forgotten'], { queryParams: { email: this.loginFormGroup.value.email } });
	}
}
