import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportMcqStepComponent } from './export-mcq-step.component';

describe('ExportMcqStepComponent', () => {
	let component: ExportMcqStepComponent;
	let fixture: ComponentFixture<ExportMcqStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportMcqStepComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportMcqStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
