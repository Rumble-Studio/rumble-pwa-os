import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GrantsManagementService, GroupsManagementService, PermissionsManagementService } from '@rumble-pwa/groups-system';
import { Group, Permission } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { AddGrantComponent } from './add-grant.component';
describe('AddGrantComponent', () => {
	let component: AddGrantComponent;
	let fixture: ComponentFixture<AddGrantComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AddGrantComponent],
			imports: [BrowserModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule],
			providers: [
				MockProvider(MatDialogRef),
				MockProvider(MAT_DIALOG_DATA, {
					grant: {
						id: '',
						permissionId: '',
						groupId: '',
					},
				}),
				MockProvider(NotificationsService),
				FormBuilder,
				MockProvider(GroupsManagementService, {
					groups$$: new BehaviorSubject<Group[]>([]),
				}),
				MockProvider(GrantsManagementService, {
					getMethods$: () => new Observable<string[]>(),
				}),
				MockProvider(PermissionsManagementService, {
					permissions$$: new BehaviorSubject<Permission[]>([]),
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				{ provide: NG_VALUE_ACCESSOR },
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AddGrantComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
