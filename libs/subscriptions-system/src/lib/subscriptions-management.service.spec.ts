import { TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { AuthService } from '@rumble-pwa/auth-system';
import { MaterialModule } from '@rumble-pwa/design-system';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';
import { SubscriptionsManagementService } from './subscriptions-management.service';
import { CategoriesQuery } from '@rumble-pwa/mega-store';
import { CategoriesService } from '@rumble-pwa/mega-store';
import { SubscriptionsQuery } from '@rumble-pwa/mega-store';
import { SubscriptionsService } from '@rumble-pwa/mega-store';
import { LanguagesQuery } from '@rumble-pwa/mega-store';
import { LanguagesService } from '@rumble-pwa/mega-store';
import { TypesQuery } from '@rumble-pwa/mega-store';
import { TypesService } from '@rumble-pwa/mega-store';

describe('SubscriptionsManagementService', () => {
	let service: SubscriptionsManagementService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [
				MockProvider(SubscriptionsService),
				MockProvider(LanguagesQuery),
				MockProvider(SubscriptionsQuery),
				MockProvider(CategoriesService),
				MockProvider(CategoriesQuery),
				MockProvider(TypesService),
				MockProvider(TypesQuery),
				MockProvider(LanguagesService),
				MockProvider(RestService),
				MockProvider(AuthService),
				MockProvider(LanguagesService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [MaterialModule],
		}).compileComponents();
	});

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(SubscriptionsManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
