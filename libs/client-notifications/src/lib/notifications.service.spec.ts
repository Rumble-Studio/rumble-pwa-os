import { TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
// import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MockProvider } from 'ng-mocks';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
	let service: NotificationsService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [MockProvider(MatSnackBar), MockProvider(MATERIAL_SANITY_CHECKS, false)],
			imports: [MatDialogModule],
		}).compileComponents();
	});

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(NotificationsService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
