import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule, MaterialModule } from '@rumble-pwa/design-system';
import { MockComponent, MockProvider } from 'ng-mocks';
import { GroupsListComponent } from '../../elements/groups-list/groups-list.component';
import { TasksListComponent } from '../../elements/tasks-list/tasks-list.component';
import { UsersListComponent } from '../../elements/users-list/users-list.component';
import { AdminPanelLayoutComponent } from './admin-panel.component';

describe('AdminPanelLayoutComponent', () => {
	let component: AdminPanelLayoutComponent;
	let fixture: ComponentFixture<AdminPanelLayoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [
				AdminPanelLayoutComponent,
				MockComponent(UsersListComponent),
				MockComponent(TasksListComponent),
				MockComponent(GroupsListComponent),
			],
			imports: [MaterialModule, BrowserAnimationsModule, RouterTestingModule, DesignSystemModule],
			providers: [MockProvider(MATERIAL_SANITY_CHECKS, false), MockProvider(RouterTestingModule)],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AdminPanelLayoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
