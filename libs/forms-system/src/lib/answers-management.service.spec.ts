import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';
import { AnswersManagementService } from './answers-management.service';
import { AnswersQuery } from '@rumble-pwa/mega-store';

describe('AnswersManagementService', () => {
	let service: AnswersManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				MockProvider(RestService),
				MockProvider(AnswersQuery),
				MockProvider(AuthService),
				MockProvider(ProfileSystemService),
			],
		});
		service = TestBed.inject(AnswersManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
