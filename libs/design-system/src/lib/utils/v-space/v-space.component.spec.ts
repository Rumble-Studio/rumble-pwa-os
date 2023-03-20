import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VSpaceComponent } from './v-space.component';

describe('VSpaceComponent', () => {
	let component: VSpaceComponent;
	let fixture: ComponentFixture<VSpaceComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [VSpaceComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(VSpaceComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
