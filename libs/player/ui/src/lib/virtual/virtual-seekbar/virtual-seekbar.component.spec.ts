import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualSeekbarComponent } from './virtual-seekbar.component';

describe('VirtualPlaybarComponent', () => {
	let component: VirtualSeekbarComponent;
	let fixture: ComponentFixture<VirtualSeekbarComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualSeekbarComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualSeekbarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
