import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';

import { TextListConsumerComponent } from './text-list-consumer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

describe('TextListConsumerComponent', () => {
	let component: TextListConsumerComponent;
	let fixture: ComponentFixture<TextListConsumerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TextListConsumerComponent],
			imports: [DesignSystemModule, BrowserAnimationsModule],
			providers: [{ provide: MATERIAL_SANITY_CHECKS, useValue: false }],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TextListConsumerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
