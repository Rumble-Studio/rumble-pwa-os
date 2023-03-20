import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';
import { GroupsManagementService } from './groups-management.service';

describe('GroupsManagementService', () => {
	let service: GroupsManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(RestService), MockProvider(AuthService), MockProvider(NotificationsService)],
		});
		service = TestBed.inject(GroupsManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
