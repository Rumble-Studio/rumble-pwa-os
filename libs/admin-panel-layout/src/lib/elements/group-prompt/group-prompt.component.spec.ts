import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '@rumble-pwa/design-system';
import { GroupsManagementService, PermissionsManagementService } from '@rumble-pwa/groups-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GroupPromptComponent } from './group-prompt.component';

describe('GroupPromptComponent', () => {
	let component: GroupPromptComponent;
	let fixture: ComponentFixture<GroupPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GroupPromptComponent],
			imports: [MaterialModule, MatDialogModule],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
				}),
				MockProvider(GroupsManagementService),
				MockProvider(PermissionsManagementService),
				MockProvider(MAT_DIALOG_DATA, {
					group: {
						id: '',
						name: '',
						kind: '',
					},
					isParent: true,
					formGroup: '',
				}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupPromptComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
