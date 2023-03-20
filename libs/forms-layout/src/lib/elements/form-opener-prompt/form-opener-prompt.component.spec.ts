import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormOpenerPromptComponent } from './form-opener-prompt.component';

describe('FormOpenerPromptComponent', () => {
	let component: FormOpenerPromptComponent;
	let fixture: ComponentFixture<FormOpenerPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FormOpenerPromptComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FormOpenerPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
