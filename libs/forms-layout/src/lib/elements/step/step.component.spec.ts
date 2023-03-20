import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { AnswersManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { MockProvider } from 'ng-mocks';

import { StepComponent } from './step.component';

describe('StepComponent', () => {
	let component: StepComponent;
	let fixture: ComponentFixture<StepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule, BrowserAnimationsModule],
			declarations: [StepComponent],
			providers: [
				MockProvider(NotificationsService),
				MockProvider(AnswersManagementService),
				MockProvider(ProfileSystemService),
				MockProvider(RecordingSessionsManagementService),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(StepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
