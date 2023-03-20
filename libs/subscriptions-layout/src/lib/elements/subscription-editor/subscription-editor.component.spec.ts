import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SubscriptionEditorComponent } from './subscription-editor.component';
import { MockProvider } from 'ng-mocks';
import { StorageService } from '@rumble-pwa/storage';
import { BehaviorSubject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SubscriptionEditorComponent', () => {
	let component: SubscriptionEditorComponent;
	let fixture: ComponentFixture<SubscriptionEditorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [SubscriptionEditorComponent],
			imports: [
				ReactiveFormsModule,
				HttpClientTestingModule,
				RouterTestingModule,
				DesignSystemModule,
				BrowserAnimationsModule,
			],
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(MAT_DIALOG_DATA, { categoryIds: [] }),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SubscriptionEditorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
