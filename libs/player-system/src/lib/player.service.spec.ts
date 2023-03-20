import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
	let service: PlayerService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(PlayerService)],
		});
		service = TestBed.inject(PlayerService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
