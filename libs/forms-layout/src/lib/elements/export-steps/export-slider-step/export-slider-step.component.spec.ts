import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportSliderStepComponent } from './export-slider-step.component';

describe('ExportSliderStepComponent', () => {
	let component: ExportSliderStepComponent;
	let fixture: ComponentFixture<ExportSliderStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportSliderStepComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportSliderStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
