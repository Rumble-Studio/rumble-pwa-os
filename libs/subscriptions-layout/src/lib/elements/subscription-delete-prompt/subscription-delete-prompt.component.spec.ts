import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SubscriptionsManagementService } from '@rumble-pwa/subscription-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { SubscriptionDeletePromptComponent } from './subscription-delete-prompt.component';

describe('SubscriptionDeletePromptComponent', () => {
	let component: SubscriptionDeletePromptComponent;
	let fixture: ComponentFixture<SubscriptionDeletePromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [SubscriptionDeletePromptComponent],
			imports: [DesignSystemModule, ReactiveFormsModule, BrowserAnimationsModule],
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(SubscriptionsManagementService),
				MockProvider(MAT_DIALOG_DATA, {}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MatDialogRef),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SubscriptionDeletePromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
