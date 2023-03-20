import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { MockProvider } from 'ng-mocks';

import { ExportPictureStepComponent } from './export-picture-step.component';

describe('ExportPictureStepComponent', () => {
	let component: ExportPictureStepComponent;
	let fixture: ComponentFixture<ExportPictureStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportPictureStepComponent],
			providers: [MockProvider(FilesManagementService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportPictureStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
