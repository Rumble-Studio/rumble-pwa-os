import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminPanelSystemService } from '@rumble-pwa/admin-panel-system';
import { MaterialModule } from '@rumble-pwa/design-system';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { User } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { UsersListComponent } from './users-list.component';
import { BillingService } from '@rumble-pwa/billing-system';

describe('UsersListComponent', () => {
	let component: UsersListComponent;
	let fixture: ComponentFixture<UsersListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [UsersListComponent],
			imports: [MaterialModule, FormsModule, MaterialModule, BrowserAnimationsModule],
			providers: [
				MockProvider(AdminPanelSystemService),
				MockProvider(BillingService),
				MockProvider(UsersManagementService, {
					users$$: new BehaviorSubject<User[]>([]),
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(UsersListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
