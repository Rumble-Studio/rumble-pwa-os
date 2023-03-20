import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { MockProvider } from 'ng-mocks';

import { GroupTableComponent } from './group-table.component';

describe('GroupTableComponent', () => {
	let component: GroupTableComponent;
	let fixture: ComponentFixture<GroupTableComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [MockProvider(GroupsManagementService), MockProvider(MatDialog)],
			declarations: [GroupTableComponent],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupTableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
