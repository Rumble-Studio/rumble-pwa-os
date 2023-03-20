import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualPlaylistRecorderComponent } from './virtual-playlist-recorder.component';

describe('VirtualPlaylistRecorderComponent', () => {
	let component: VirtualPlaylistRecorderComponent;
	let fixture: ComponentFixture<VirtualPlaylistRecorderComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualPlaylistRecorderComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualPlaylistRecorderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
