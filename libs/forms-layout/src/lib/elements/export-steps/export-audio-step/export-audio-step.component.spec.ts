import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportAudioStepComponent } from './export-audio-step.component';

describe('ExportAudioStepComponent', () => {
	let component: ExportAudioStepComponent;
	let fixture: ComponentFixture<ExportAudioStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportAudioStepComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportAudioStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
