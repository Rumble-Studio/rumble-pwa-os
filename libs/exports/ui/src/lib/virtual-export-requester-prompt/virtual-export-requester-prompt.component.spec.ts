import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualExportRequesterPromptComponent } from './virtual-export-requester-prompt.component';

describe('VirtualExportRequesterPromptComponent', () => {
	let component: VirtualExportRequesterPromptComponent;
	let fixture: ComponentFixture<VirtualExportRequesterPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [VirtualExportRequesterPromptComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(VirtualExportRequesterPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
