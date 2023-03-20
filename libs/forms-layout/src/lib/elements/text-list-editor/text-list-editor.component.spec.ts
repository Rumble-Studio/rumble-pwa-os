import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';

import { TextListEditorComponent } from './text-list-editor.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

describe('TextListEditorComponent', () => {
	let component: TextListEditorComponent;
	let fixture: ComponentFixture<TextListEditorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TextListEditorComponent],
			imports: [DesignSystemModule, BrowserAnimationsModule],
			providers: [{ provide: MATERIAL_SANITY_CHECKS, useValue: false }],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TextListEditorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
