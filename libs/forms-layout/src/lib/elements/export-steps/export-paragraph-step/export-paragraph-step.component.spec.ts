import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportParagraphStepComponent } from './export-paragraph-step.component';

describe('ExportParagraphStepComponent', () => {
	let component: ExportParagraphStepComponent;
	let fixture: ComponentFixture<ExportParagraphStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportParagraphStepComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(ExportParagraphStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
