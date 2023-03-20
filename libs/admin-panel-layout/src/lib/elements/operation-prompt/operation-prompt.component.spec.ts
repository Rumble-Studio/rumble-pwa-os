import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@rumble-pwa/design-system';
import { GroupsManagementService, OperationsManagementService } from '@rumble-pwa/groups-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { MockProvider } from 'ng-mocks';
import { OperationPromptComponent } from './operation-prompt.component';

describe('OperationPromptComponent', () => {
	let component: OperationPromptComponent;
	let fixture: ComponentFixture<OperationPromptComponent>;
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MaterialModule, MatDialogModule, FormsModule, ReactiveFormsModule, BrowserAnimationsModule],
			declarations: [OperationPromptComponent],
			providers: [
				MockProvider(MatDialogRef),
				MockProvider(GroupsManagementService),
				MockProvider(ProfileSystemService),
				MockProvider(OperationsManagementService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MAT_DIALOG_DATA, {}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(OperationPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
