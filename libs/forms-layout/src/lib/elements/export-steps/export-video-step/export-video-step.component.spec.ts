import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { MockProvider } from 'ng-mocks';

import { ExportVideoStepComponent } from './export-video-step.component';

describe('ExportVideoStepComponent', () => {
	let component: ExportVideoStepComponent;
	let fixture: ComponentFixture<ExportVideoStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportVideoStepComponent],
			providers: [MockProvider(FilesManagementService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportVideoStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
