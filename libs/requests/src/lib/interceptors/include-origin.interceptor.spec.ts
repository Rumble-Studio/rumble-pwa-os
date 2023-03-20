import { TestBed } from '@angular/core/testing';

import { IncludeOriginInterceptor } from './include-origin.interceptor';

describe('IncludeOriginInterceptor', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			providers: [IncludeOriginInterceptor],
		})
	);

	it('should be created', () => {
		const interceptor: IncludeOriginInterceptor = TestBed.inject(IncludeOriginInterceptor);
		expect(interceptor).toBeTruthy();
	});
});
