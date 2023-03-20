import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { DesignSystemModule, MaterialModule } from '@rumble-pwa/design-system';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Group } from '@rumble-pwa/mega-store';
import { AdminPanelSystemService } from 'libs/admin-panel-system/src/lib/admin-panel-system.service';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GroupsListComponent } from './groups-list.component';

describe('GroupsListComponent', () => {
	let component: GroupsListComponent;
	let fixture: ComponentFixture<GroupsListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GroupsListComponent],
			imports: [
				RouterModule.forRoot([]),
				HttpClientModule,
				CommonModule,
				BrowserModule,
				BrowserAnimationsModule,
				DesignSystemModule,
				MaterialModule,
			],
			providers: [
				MockProvider(GroupsManagementService, {
					groups$$: new BehaviorSubject<Group[]>([]),
				}),
				MockProvider(AdminPanelSystemService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(APP_BASE_HREF, '/'),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
