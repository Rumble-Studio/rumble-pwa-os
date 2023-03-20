import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualPlaylistComponent } from './virtual-playlist.component';

describe('VirtualPlaylistComponent', () => {
	let component: VirtualPlaylistComponent;
	let fixture: ComponentFixture<VirtualPlaylistComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualPlaylistComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualPlaylistComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
