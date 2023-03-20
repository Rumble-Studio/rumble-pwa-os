import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextListControlComponent } from './text-list-control.component';

describe('TextListControlComponent', () => {
	let component: TextListControlComponent;
	let fixture: ComponentFixture<TextListControlComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TextListControlComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TextListControlComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
