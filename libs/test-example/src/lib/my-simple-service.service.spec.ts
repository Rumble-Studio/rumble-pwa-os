import { TestBed } from '@angular/core/testing';

import { MySimpleServiceService } from './my-simple-service.service';

describe('MySimpleServiceService', () => {
	let service: MySimpleServiceService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MySimpleServiceService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
