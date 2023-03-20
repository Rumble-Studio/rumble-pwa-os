import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MockProvider } from 'ng-mocks';
import { GoogleIdentityService } from './google-identity.service';

describe('GoogleIdentityService', () => {
	let service: GoogleIdentityService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(NotificationsService), MockProvider(AuthService)],
		});
		service = TestBed.inject(GoogleIdentityService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
