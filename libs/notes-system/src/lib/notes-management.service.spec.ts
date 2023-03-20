import { TestBed } from '@angular/core/testing';

import { NotesManagementService } from './notes-management.service';

describe('NotesManagementService', () => {
	let service: NotesManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(NotesManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
