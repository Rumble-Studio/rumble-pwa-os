import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesUploadControlComponent } from './files-upload-control.component';

describe('FilesUploadControlComponent', () => {
	let component: FilesUploadControlComponent;
	let fixture: ComponentFixture<FilesUploadControlComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FilesUploadControlComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FilesUploadControlComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
