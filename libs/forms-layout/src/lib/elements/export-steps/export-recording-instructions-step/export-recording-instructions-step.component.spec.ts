import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportRecordingInstructionsStepComponent } from './export-recording-instructions-step.component';

describe('ExportRecordingInstructionsStepComponent', () => {
	let component: ExportRecordingInstructionsStepComponent;
	let fixture: ComponentFixture<ExportRecordingInstructionsStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportRecordingInstructionsStepComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportRecordingInstructionsStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
