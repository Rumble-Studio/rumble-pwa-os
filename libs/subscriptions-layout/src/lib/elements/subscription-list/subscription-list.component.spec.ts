import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { SubscriptionDeletePromptComponent } from '../../elements/subscription-delete-prompt/subscription-delete-prompt.component';
import { SubscriptionEditorComponent } from '../../elements/subscription-editor/subscription-editor.component';
import { RouterTestingModule } from '@angular/router/testing';

import { SubscriptionListComponent } from './subscription-list.component';
import { MockProvider } from 'ng-mocks';
import { StorageService } from '@rumble-pwa/storage';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { DesignSystemModule } from '@rumble-pwa/design-system';

describe('SubscriptionListComponent', () => {
	let component: SubscriptionListComponent;
	let fixture: ComponentFixture<SubscriptionListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [SubscriptionListComponent, SubscriptionEditorComponent, SubscriptionDeletePromptComponent],
			imports: [MatDialogModule, HttpClientTestingModule, RouterTestingModule, DesignSystemModule],
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SubscriptionListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
