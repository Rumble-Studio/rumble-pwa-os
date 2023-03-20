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
import { AddGroupChildComponent } from './add-group-child.component';

describe('AddGroupChildComponent', () => {
	let component: AddGroupChildComponent;
	let fixture: ComponentFixture<AddGroupChildComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AddGroupChildComponent],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MAT_DIALOG_DATA, {
					group: {
						id: '',
						name: '',
						kind: '',
					},
				}),
				MockProvider(NotificationsService),
				MockProvider(MatDialogRef),
				MockProvider(GroupsManagementService, {
					groups$$: new BehaviorSubject<Group[]>([]),
				}),
			],
			imports: [MaterialModule, BrowserAnimationsModule, ReactiveFormsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AddGroupChildComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
