import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanItemPageComponent } from './plan-item-page.component';

describe('PlanItemPageComponent', () => {
	let component: PlanItemPageComponent;
	let fixture: ComponentFixture<PlanItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PlanItemPageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PlanItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
