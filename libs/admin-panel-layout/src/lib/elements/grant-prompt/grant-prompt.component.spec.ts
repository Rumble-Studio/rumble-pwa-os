import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '@rumble-pwa/design-system';
import { PermissionsManagementService } from '@rumble-pwa/groups-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GrantPromptComponent } from './grant-prompt.component';

describe('GrantPromptComponent', () => {
	let component: GrantPromptComponent;
	let fixture: ComponentFixture<GrantPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GrantPromptComponent],
			imports: [MaterialModule, MatDialogModule],
			providers: [
				MockProvider(PermissionsManagementService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
				}),
				MockProvider(MAT_DIALOG_DATA, {
					grant: {
						id: '',
						permissionId: '',
						groupId: '',
					},
				}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GrantPromptComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
