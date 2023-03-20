import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportShareThisFormStepComponent } from './export-share-this-form-step.component';

describe('ExportShareThisFormStepComponent', () => {
	let component: ExportShareThisFormStepComponent;
	let fixture: ComponentFixture<ExportShareThisFormStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportShareThisFormStepComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportShareThisFormStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
