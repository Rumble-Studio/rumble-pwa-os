import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { PersistenceService } from './persistence.service';
import { StorageService } from './storage.service';

describe('PersistenceService', () => {
	let service: PersistenceService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
		});
		service = TestBed.inject(PersistenceService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
