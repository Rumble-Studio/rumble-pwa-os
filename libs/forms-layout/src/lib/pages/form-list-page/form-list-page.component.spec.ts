import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';

import { FormListPageComponent } from './form-list-page.component';

describe('FormListPageComponent', () => {
	let component: FormListPageComponent;
	let fixture: ComponentFixture<FormListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FormListPageComponent],
			providers: [
				MockProvider(MatDialog),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(FormsManagementService),
				MockProvider(ProfileSystemService),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
