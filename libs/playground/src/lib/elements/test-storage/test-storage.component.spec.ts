import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestStorageComponent } from './test-storage.component';

describe('TestStorageComponent', () => {
	let component: TestStorageComponent;
	let fixture: ComponentFixture<TestStorageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TestStorageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TestStorageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
