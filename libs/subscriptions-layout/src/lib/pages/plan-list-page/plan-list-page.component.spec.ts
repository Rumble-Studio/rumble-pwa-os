import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanListPageComponent } from './plan-list-page.component';

describe('PlanListPageComponent', () => {
	let component: PlanListPageComponent;
	let fixture: ComponentFixture<PlanListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PlanListPageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PlanListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
