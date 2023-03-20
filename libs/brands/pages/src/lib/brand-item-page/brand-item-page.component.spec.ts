import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandItemPageComponent } from './brand-item-page.component';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable } from 'rxjs';
import { BrandsManagementService } from '@rumble-pwa/brands-system';
import { MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '@rumble-pwa/design-system';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { StorageService } from '@rumble-pwa/storage';

describe('BrandItemComponent', () => {
	let component: BrandItemPageComponent;
	let fixture: ComponentFixture<BrandItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [BrandItemPageComponent],
			providers: [
				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
				MockProvider(BrandsManagementService),
				MockProvider(FilesManagementService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			imports: [MatDialogModule, MaterialModule, RouterTestingModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(BrandItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
