import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';

import { RecordingSessionsManagementService } from './recording-sessions-management.service';

describe('RecordingSessionsManagementService', () => {
	let service: RecordingSessionsManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(RestService), MockProvider(AuthService), MockProvider(RecordingSessionsManagementService)],
		});
		service = TestBed.inject(RecordingSessionsManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
