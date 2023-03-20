import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import { GrantsManagementService, GroupsManagementService, PermissionsManagementService } from '@rumble-pwa/groups-system';
import { Group } from '@rumble-pwa/mega-store';
import { StorageService } from '@rumble-pwa/storage';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { GroupItemComponent } from './group-item.component';
import { FilesManagementService } from '@rumble-pwa/files-system';

describe('GroupItemComponent', () => {
	let component: GroupItemComponent;
	let fixture: ComponentFixture<GroupItemComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterTestingModule],
			providers: [
				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
				MockProvider(GroupsManagementService, {
					groups$$: new BehaviorSubject<Group[]>([]),
				}),
				MockProvider(PermissionsManagementService),
				MockProvider(MatDialog),
				MockProvider(FilesManagementService),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(UsersManagementService),
				MockProvider(GrantsManagementService),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			declarations: [GroupItemComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupItemComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
