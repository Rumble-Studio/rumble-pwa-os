import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';

import { StepsManagementService } from './steps-management.service';

describe('StepsManagementService', () => {
	let service: StepsManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(RestService), MockProvider(AuthService), MockProvider(StepsManagementService)],
		});
		service = TestBed.inject(StepsManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
