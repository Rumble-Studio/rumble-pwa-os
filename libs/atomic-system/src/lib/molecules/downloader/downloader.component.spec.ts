import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { RestService } from '@rumble-pwa/requests';
import { StorageModule, StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { DownloaderComponent } from './downloader.component';

describe('DownloaderComponent', () => {
	let component: DownloaderComponent;
	let fixture: ComponentFixture<DownloaderComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DownloaderComponent],
			imports: [DesignSystemModule, StorageModule],
			providers: [
				MockProvider(RestService),
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
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(DownloaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
