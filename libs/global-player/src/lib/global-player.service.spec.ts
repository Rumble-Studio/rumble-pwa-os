import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { GlobalPlayerService } from './global-player.service';

describe('GlobalPlayerService', () => {
	let service: GlobalPlayerService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(GlobalPlayerService)],
		});
		service = TestBed.inject(GlobalPlayerService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
