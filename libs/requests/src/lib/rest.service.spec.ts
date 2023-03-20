import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { RestService } from './rest.service';

describe('RestService', () => {
	let service: RestService;

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [MockProvider(RestService)] });
		service = TestBed.inject(RestService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
