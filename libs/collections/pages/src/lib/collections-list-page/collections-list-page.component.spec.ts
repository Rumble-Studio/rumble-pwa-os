import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { CollectionListComponent } from '../../elements/collection-list/collection-list.component';
import { CollectionsListPageComponent } from './collections-list-page.component';

describe('CollectionsLayoutComponent', () => {
	let component: CollectionsListPageComponent;
	let fixture: ComponentFixture<CollectionsListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [CollectionsListPageComponent, CollectionListComponent],

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
		fixture = TestBed.createComponent(CollectionsListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
