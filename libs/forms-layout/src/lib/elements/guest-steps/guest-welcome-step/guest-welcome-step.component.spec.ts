import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { AuthDialogService } from '@rumble-pwa/auth-layout';
import { AuthService } from '@rumble-pwa/auth-system';
import { BrandsManagementService } from '@rumble-pwa/brands-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { StorageService } from '@rumble-pwa/storage';
import { User } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { GuestWelcomeStepComponent } from './guest-welcome-step.component';

describe('GuestWelcomeStepComponent', () => {
	let component: GuestWelcomeStepComponent;
	let fixture: ComponentFixture<GuestWelcomeStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GuestWelcomeStepComponent],
			imports: [BrowserModule, FormsModule, ReactiveFormsModule],
			providers: [
				MockProvider(BrandsManagementService),
				MockProvider(NotificationsService),
				MockProvider(AuthService),
				MockProvider(AuthDialogService),
				MockProvider(ProfileSystemService, {
					profile$: new Observable<User | undefined>(undefined),
				}),
				FormBuilder,
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(FilesManagementService),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GuestWelcomeStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
