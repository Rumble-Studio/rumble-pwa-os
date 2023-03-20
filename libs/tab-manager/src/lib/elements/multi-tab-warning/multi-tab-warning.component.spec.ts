import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiTabWarningComponent } from './multi-tab-warning.component';

describe('MultiTabWarningComponent', () => {
	let component: MultiTabWarningComponent;
	let fixture: ComponentFixture<MultiTabWarningComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MultiTabWarningComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(MultiTabWarningComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
