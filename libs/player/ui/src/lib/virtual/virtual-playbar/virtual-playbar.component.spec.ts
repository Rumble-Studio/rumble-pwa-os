import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualPlaybarComponent } from './virtual-playbar.component';

describe('VirtualPlaybarComponent', () => {
	let component: VirtualPlaybarComponent;
	let fixture: ComponentFixture<VirtualPlaybarComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualPlaybarComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualPlaybarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
