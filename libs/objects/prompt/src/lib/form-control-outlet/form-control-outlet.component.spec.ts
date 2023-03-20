import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormControlOutletComponent } from './form-control-outlet.component';

describe('FormControlOutletComponent', () => {
	let component: FormControlOutletComponent;
	let fixture: ComponentFixture<FormControlOutletComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FormControlOutletComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FormControlOutletComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
