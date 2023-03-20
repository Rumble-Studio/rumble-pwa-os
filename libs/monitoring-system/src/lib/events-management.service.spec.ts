import { TestBed } from '@angular/core/testing';

import { EventsManagementService } from './events-management.service';

describe('EventsManagementService', () => {
	let service: EventsManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(EventsManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
