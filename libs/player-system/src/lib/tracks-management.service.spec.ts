import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';

import { TracksManagementService } from './tracks-management.service';

describe('TrackManagementService', () => {
	let service: TracksManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(RestService), MockProvider(FilesManagementService), MockProvider(AuthService)],
		});
		service = TestBed.inject(TracksManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
