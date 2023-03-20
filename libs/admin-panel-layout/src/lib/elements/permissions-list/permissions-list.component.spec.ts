import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DesignSystemModule, MaterialModule } from '@rumble-pwa/design-system';
import { PermissionsManagementService } from '@rumble-pwa/groups-system';
import { Permission } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { PermissionsListComponent } from './permissions-list.component';

describe('PermissionsListComponent', () => {
	let component: PermissionsListComponent;
	let fixture: ComponentFixture<PermissionsListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BrowserAnimationsModule, DesignSystemModule, MaterialModule],
			declarations: [PermissionsListComponent],
			providers: [
				MockProvider(PermissionsManagementService, {
					permissions$$: new BehaviorSubject<Permission[]>([]),
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PermissionsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
