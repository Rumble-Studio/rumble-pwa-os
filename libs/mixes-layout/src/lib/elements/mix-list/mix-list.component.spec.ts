import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrandsManagementService } from '@rumble-pwa/brands-system';
import { DesignSystemModule, MaterialModule } from '@rumble-pwa/design-system';
import { GlobalPlayerService } from '@rumble-pwa/global-player';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { VisionService } from '@rumble-pwa/utils';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { Mix, Brand } from '@rumble-pwa/mega-store';

import { MixListComponent } from './mix-list.component';
import { StorageService } from '@rumble-pwa/storage';

describe('MixListComponent', () => {
	let component: MixListComponent;
	let fixture: ComponentFixture<MixListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MixListComponent],
			providers: [
				MockProvider(MixesManagementService, {
					mixes$$: new BehaviorSubject<Mix[]>([]),
				}),
				MockProvider(BrandsManagementService),
				MockProvider(VisionService),
				MockProvider(GlobalPlayerService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(BrandsManagementService, {
					brands$$: new BehaviorSubject<Brand[]>([]),
				}),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			imports: [DesignSystemModule, MaterialModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(MixListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
