import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MockProvider } from 'ng-mocks';
import { AuthDialogService } from './auth-dialog.service';

describe('AuthDialogService', () => {
	let service: AuthDialogService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [MockProvider(MatDialog)],
		});
	});

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(AuthDialogService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
