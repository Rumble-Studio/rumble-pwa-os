import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BrandsManagementService } from '@rumble-pwa/brands-system';
import { DesignSystemModule, MaterialModule } from '@rumble-pwa/design-system';
import { LayoutService } from '@rumble-pwa/utils';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { BrandListPageComponent } from './brand-list-page.component';

@Component({
	selector: 'rumble-pwa-brand-list',
	template: '<div></div>',
})
export class FakeBrandListComponent {}

describe('BrandsListPageComponent', () => {
	let component: BrandListPageComponent;
	let fixture: ComponentFixture<BrandListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [BrandListPageComponent, FakeBrandListComponent],
			providers: [
				MockProvider(LayoutService, {
					layoutSize$$: new BehaviorSubject<number>(0),
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(BrandsManagementService),
			],
			imports: [MatDialogModule, MaterialModule, RouterTestingModule, DesignSystemModule],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(BrandListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
