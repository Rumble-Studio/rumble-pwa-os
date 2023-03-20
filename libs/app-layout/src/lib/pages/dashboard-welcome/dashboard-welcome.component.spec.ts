import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BrandsManagementService } from '@rumble-pwa/brands-system';
import { DesignSystemModule, MaterialModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { GrantsManagementService, PermissionService } from '@rumble-pwa/groups-system';
import { Brand, Mix, Profile, Script } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { StorageService } from '@rumble-pwa/storage';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { DashboardWelcomeComponent } from './dashboard-welcome.component';

// @Component({
//   selector: 'rumble-pwa-small-brand-card',
//   template: '<div></div>',
// })
// class FakeSmallBrandCardComponent {
//   @Input() brandId!: string | undefined;
// }

describe('DashboardWelcomeComponent', () => {
	let component: DashboardWelcomeComponent;
	let fixture: ComponentFixture<DashboardWelcomeComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DashboardWelcomeComponent],
			imports: [MatDialogModule, MaterialModule, RouterTestingModule, DesignSystemModule],
			providers: [
				MockProvider(FormsManagementService),
				MockProvider(ChangeDetectorRef),
				MockProvider(PermissionService, {
					can$(permissionKey: string) {
						return new Observable<boolean>();
					},
				}),
				MockProvider(GrantsManagementService, { grantsLoaded$$: new BehaviorSubject<boolean>(false) }),
				MockProvider(ProfileSystemService, { profile$: new Observable<Profile | undefined>() }),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(MixesManagementService, { mixes$$: new BehaviorSubject<Mix[]>([]) }),
				MockProvider(UsersManagementService),
				MockProvider(FilesManagementService),
				MockProvider(BrandsManagementService, {
					getAll$() {
						return new Observable<Brand[]>();
					},
				}),

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
		fixture = TestBed.createComponent(DashboardWelcomeComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
