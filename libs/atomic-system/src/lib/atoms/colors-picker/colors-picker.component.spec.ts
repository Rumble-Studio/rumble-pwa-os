import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';

import { ColorsPickerComponent } from './colors-picker.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { StorageService } from '@rumble-pwa/storage';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

describe('ColorsPickerComponent', () => {
	let component: ColorsPickerComponent;
	let fixture: ComponentFixture<ColorsPickerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ColorsPickerComponent],
			imports: [DesignSystemModule, HttpClientTestingModule, RouterTestingModule],
			providers: [MockProvider(StorageService), MockProvider(MATERIAL_SANITY_CHECKS, false)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ColorsPickerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
