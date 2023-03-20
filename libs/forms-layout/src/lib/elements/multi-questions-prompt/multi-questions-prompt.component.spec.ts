import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';

import { MultiQuestionsPromptComponent } from './multi-questions-prompt.component';

describe('MultiQuestionsPromptComponent', () => {
	let component: MultiQuestionsPromptComponent;
	let fixture: ComponentFixture<MultiQuestionsPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule, BrowserAnimationsModule],
			declarations: [MultiQuestionsPromptComponent],
			providers: [MockProvider(MatDialogRef), FormBuilder, MockProvider(MATERIAL_SANITY_CHECKS, false)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(MultiQuestionsPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
