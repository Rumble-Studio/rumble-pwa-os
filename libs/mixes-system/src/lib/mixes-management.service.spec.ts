import { TestBed } from '@angular/core/testing';
import { RestService } from '@rumble-pwa/requests';
import { BehaviorSubject, Observable } from 'rxjs';

import { MixesManagementService } from './mixes-management.service';
import { Mix } from '@rumble-pwa/mega-store';
import { MixesQuery } from '@rumble-pwa/mega-store';
import { AuthService } from '@rumble-pwa/auth-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MixesService } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';

describe('MixesManagementService', () => {
	let service: MixesManagementService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [
				MockProvider(RestService),
				MockProvider(MixesService),
				MockProvider(AuthService),
				MockProvider(NotificationsService),
				MockProvider(MixesQuery, {
					mixes$$: new BehaviorSubject<Mix[]>([
						{
							id: '1',
							name: 'test',
							description: 'description',
						},
					]),
					mixes$: new Observable<Mix[]>(),
				}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MixesManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
