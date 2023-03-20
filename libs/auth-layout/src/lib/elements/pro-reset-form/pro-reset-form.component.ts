import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
	AbstractControl,
	FormBuilder,
	FormControl,
	FormGroup,
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
	Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '@rumble-pwa/auth-system';
import { getRouteQueryParam$ } from '@rumble-pwa/utils';
import { merge, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-pro-reset-form',
	templateUrl: './pro-reset-form.component.html',
	styleUrls: ['./pro-reset-form.component.scss'],
})
export class ProResetFormComponent {
	resetFormGroup: FormGroup;
	triggerValidators$: ReplaySubject<boolean> = new ReplaySubject();

	constructor(
		private cdr: ChangeDetectorRef,
		private formBuilder: FormBuilder,
		private authService: AuthService,
		private activatedRoute: ActivatedRoute
	) {
		this.resetFormGroup = this.formBuilder.group({
			email: new FormControl('', {
				updateOn: 'change',
			}),
		});

		const email = this.resetFormGroup.controls.email;
		merge(this.triggerValidators$, email.valueChanges).subscribe(() => {
			const errors = {
				...Validators.email(email),
				...Validators.required(email),
			};
			if (Object.keys(errors).length > 0) {
				email.setErrors(errors);
			}
			this.check();
		});
		this.check();

		getRouteQueryParam$(this.activatedRoute, 'email')
			.pipe(
				untilDestroyed(this),
				tap((emailInQuery) => {
					if (emailInQuery) {
						email.patchValue(emailInQuery);
						this.resetFormGroup.markAsTouched();
						this.check();
					}
				})
			)
			.subscribe();
	}

	onSubmit() {
		if (!this.resetFormGroup.valid) return;
		const userEmail = this.resetFormGroup.get('email')?.value;
		if (!userEmail) return;
		console.log('%c(onSubmit)', 'color:crimson', userEmail);
		this.authService.resetPasswordRequest(userEmail as string);
	}

	check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
