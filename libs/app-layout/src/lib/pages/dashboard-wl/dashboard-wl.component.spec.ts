import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardWlComponent } from './dashboard-wl.component';

describe('DashboardWlComponent', () => {
	let component: DashboardWlComponent;
	let fixture: ComponentFixture<DashboardWlComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DashboardWlComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(DashboardWlComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
