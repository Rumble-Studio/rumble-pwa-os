import { TestBed } from '@angular/core/testing';

import { AmplitudeService } from './amplitude.service';

describe('AmplitudeService', () => {
	let service: AmplitudeService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(AmplitudeService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
