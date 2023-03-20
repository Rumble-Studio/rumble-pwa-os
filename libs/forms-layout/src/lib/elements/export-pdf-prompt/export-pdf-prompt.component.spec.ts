import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportPdfPromptComponent } from './export-pdf-prompt.component';

describe('ExportPdfPromptComponent', () => {
	let component: ExportPdfPromptComponent;
	let fixture: ComponentFixture<ExportPdfPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportPdfPromptComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportPdfPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
