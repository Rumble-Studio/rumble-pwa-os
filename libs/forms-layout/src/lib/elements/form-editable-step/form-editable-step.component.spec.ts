import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';

import { FormEditableStepComponent } from './form-editable-step.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { StorageService } from '@rumble-pwa/storage';

describe('FormEditableStepComponent', () => {
	let component: FormEditableStepComponent;
	let fixture: ComponentFixture<FormEditableStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FormEditableStepComponent],
			imports: [DesignSystemModule, HttpClientTestingModule, RouterTestingModule],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormEditableStepComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
