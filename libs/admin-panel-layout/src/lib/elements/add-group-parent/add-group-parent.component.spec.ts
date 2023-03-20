import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MaterialModule } from '@rumble-pwa/design-system';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Group } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AddGroupParentComponent } from './add-group-parent.component';

describe('AddGroupParentComponent', () => {
	let component: AddGroupParentComponent;
	let fixture: ComponentFixture<AddGroupParentComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AddGroupParentComponent],
			providers: [
				MockProvider(MatDialogRef),
				MockProvider(GroupsManagementService, {
					groups$$: new BehaviorSubject<Group[]>([]),
				}),
				MockProvider(NotificationsService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MAT_DIALOG_DATA, {
					group: {
						id: '',
						name: '',
						kind: '',
					},
				}),
			],
			imports: [MaterialModule, BrowserAnimationsModule, ReactiveFormsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AddGroupParentComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
