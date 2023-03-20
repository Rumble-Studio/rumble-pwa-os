import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Notification, NotificationsQuery } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationsManagementService } from './notifications-management.service';

describe('NotificationsManagementService', () => {
	let service: NotificationsManagementService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [
				MockProvider(RestService),
				MockProvider(NotificationsQuery, {
					notifications$$: new BehaviorSubject<Notification[]>([
						{
							id: '1',
							ownerId: '',
							title: 'test',
							kind: 'test-notification',
							groupId: 'mat007',
							seenBy: [],
						},
					]),
					notifications$: new Observable<Notification[]>(),
				}),
				MockProvider(NotificationsService),
				MockProvider(AuthService),
				MockProvider(NotificationsService),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(NotificationsManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
