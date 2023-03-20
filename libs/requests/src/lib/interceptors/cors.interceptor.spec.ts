import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { CorsInterceptor } from './cors.interceptor';

describe('CorsInterceptor', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			providers: [CorsInterceptor],
		})
	);

	it('should be created', () => {
		const interceptor: CorsInterceptor = TestBed.inject(CorsInterceptor);
		expect(interceptor).toBeTruthy();
	});
});
