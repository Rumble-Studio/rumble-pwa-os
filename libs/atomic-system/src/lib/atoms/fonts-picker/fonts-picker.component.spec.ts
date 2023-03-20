import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';

import { FontsPickerComponent } from './fonts-picker.component';

describe('FontsPickerComponent', () => {
	let component: FontsPickerComponent;
	let fixture: ComponentFixture<FontsPickerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FontsPickerComponent],
			imports: [DesignSystemModule, HttpClientTestingModule, RouterTestingModule],
			providers: [MockProvider(StorageService), MockProvider(MATERIAL_SANITY_CHECKS, false)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FontsPickerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
