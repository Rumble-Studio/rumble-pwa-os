import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';

import { CollectionItemPageComponent } from './collection-item-page.component';

describe('CollectionItemPageComponent', () => {
	let component: CollectionItemPageComponent;
	let fixture: ComponentFixture<CollectionItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [CollectionItemPageComponent],

			imports: [DesignSystemModule, HttpClientTestingModule, RouterTestingModule],
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
		fixture = TestBed.createComponent(CollectionItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
