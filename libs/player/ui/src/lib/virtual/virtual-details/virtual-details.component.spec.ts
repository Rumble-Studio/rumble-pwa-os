import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualDetailsComponent } from './virtual-details.component';

describe('VirtualDetailsComponent', () => {
	let component: VirtualDetailsComponent;
	let fixture: ComponentFixture<VirtualDetailsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualDetailsComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualDetailsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
