import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MockProvider } from 'ng-mocks';
import { ImageZoomService } from './image-zoom.service';

describe('ImageZoomService', () => {
	let service: ImageZoomService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(MatDialog)],
		});
		service = TestBed.inject(ImageZoomService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
