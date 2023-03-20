import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { AnswersManagementService, FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { MockProvider } from 'ng-mocks';

import { FormComponent } from './form.component';

describe('FormComponent', () => {
	let component: FormComponent;
	let fixture: ComponentFixture<FormComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				// MatSnackBarModule,
				HttpClientTestingModule,
				RouterTestingModule,
				// DesignSystemModule,
				// BrowserAnimationsModule,
			],
			declarations: [FormComponent],
			providers: [
				MockProvider(AnswersManagementService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(NotificationsService),
				MockProvider(FormsManagementService),
				MockProvider(ProfileSystemService),
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
