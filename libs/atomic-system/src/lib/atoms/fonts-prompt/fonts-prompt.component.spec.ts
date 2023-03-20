import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';

import { FontsPromptComponent } from './fonts-prompt.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('FontsPromptComponent', () => {
	let component: FontsPromptComponent;
	let fixture: ComponentFixture<FontsPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FontsPromptComponent],
			imports: [DesignSystemModule, BrowserAnimationsModule],
			providers: [
				MockProvider(MatDialogRef),
				MockProvider(MAT_DIALOG_DATA, {
					fonts: [{ label: 'font', value: 'font' }],
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FontsPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
