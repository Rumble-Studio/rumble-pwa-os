import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { SubscriptionListComponent } from '../../elements/subscription-list/subscription-list.component';
import { SubscriptionsListPageComponent } from './subscription-list-page.component';

describe('SubscriptionsLayoutComponent', () => {
	let component: SubscriptionsListPageComponent;
	let fixture: ComponentFixture<SubscriptionsListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [SubscriptionsListPageComponent, SubscriptionListComponent],

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
		fixture = TestBed.createComponent(SubscriptionsListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
