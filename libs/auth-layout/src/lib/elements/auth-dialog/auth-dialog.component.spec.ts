import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MaterialModule } from '@rumble-pwa/design-system';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { GoogleIdentityService } from '@rumble-pwa/social-login-system';
import { MockComponent, MockProvider } from 'ng-mocks';
import { LoginFormComponent } from '../login-form/login-form.component';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { AuthDialogComponent } from './auth-dialog.component';

describe('AuthDialogComponent', () => {
	let component: AuthDialogComponent;
	let fixture: ComponentFixture<AuthDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AuthDialogComponent, MockComponent(LoginFormComponent), MockComponent(RegisterFormComponent)],
			providers: [
				MockProvider(AuthService),
				MockProvider(MatDialogRef),
				MockProvider(NotificationsService),
				MockProvider(GoogleIdentityService),
				MockProvider(FormsManagementService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MAT_DIALOG_DATA, {}),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			imports: [MaterialModule, MatDialogModule, BrowserAnimationsModule, RouterTestingModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AuthDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
