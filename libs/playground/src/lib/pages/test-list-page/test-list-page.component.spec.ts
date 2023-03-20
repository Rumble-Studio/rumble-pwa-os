import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestListPageComponent } from './test-list-page.component';

describe('TestListPageComponent', () => {
	let component: TestListPageComponent;
	let fixture: ComponentFixture<TestListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TestListPageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TestListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
