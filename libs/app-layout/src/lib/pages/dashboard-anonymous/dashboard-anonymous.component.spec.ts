import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAnonymousComponent } from './dashboard-anonymous.component';

describe('DashboardAnonymousComponent', () => {
	let component: DashboardAnonymousComponent;
	let fixture: ComponentFixture<DashboardAnonymousComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DashboardAnonymousComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(DashboardAnonymousComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
