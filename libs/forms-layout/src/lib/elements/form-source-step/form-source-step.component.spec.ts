import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSourceStepComponent } from './form-source-step.component';

describe('FormSourceStepComponent', () => {
	let component: FormSourceStepComponent;
	let fixture: ComponentFixture<FormSourceStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FormSourceStepComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormSourceStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
