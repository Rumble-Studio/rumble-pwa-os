import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualTranscriptComponent } from './virtual-transcript.component';

describe('VirtualTranscriptComponent', () => {
	let component: VirtualTranscriptComponent;
	let fixture: ComponentFixture<VirtualTranscriptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualTranscriptComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualTranscriptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
