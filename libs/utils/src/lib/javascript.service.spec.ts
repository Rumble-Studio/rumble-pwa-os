import { TestBed } from '@angular/core/testing';

import { JavascriptService } from './javascript.service';

describe('JavascriptService', () => {
	let service: JavascriptService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(JavascriptService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
