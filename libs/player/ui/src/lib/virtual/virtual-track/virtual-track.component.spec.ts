import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualTrackComponent } from './virtual-track.component';

describe('VirtualTrackComponent', () => {
	let component: VirtualTrackComponent;
	let fixture: ComponentFixture<VirtualTrackComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualTrackComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualTrackComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
