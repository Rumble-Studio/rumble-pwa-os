import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { AnswersManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { RecorderService } from '@rumble-pwa/record-system';
import { MockProvider } from 'ng-mocks';

import { FormStepperComponent } from './form-stepper.component';

describe('FormStepperComponent', () => {
	let component: FormStepperComponent;
	let fixture: ComponentFixture<FormStepperComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FormStepperComponent],
			providers: [
				MockProvider(NotificationsService),
				MockProvider(RecorderService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(AnswersManagementService),
				MockProvider(PlaylistsManagementService),
				MockProvider(ProfileSystemService),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormStepperComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
