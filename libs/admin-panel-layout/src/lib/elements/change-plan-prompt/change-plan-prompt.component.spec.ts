import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePlanPromptComponent } from './change-plan-prompt.component';

describe('ChangePlanPromptComponent', () => {
	let component: ChangePlanPromptComponent;
	let fixture: ComponentFixture<ChangePlanPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ChangePlanPromptComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(ChangePlanPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
