import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { MockProvider } from 'ng-mocks';

import { GroupPropertiesPromptComponent } from './group-properties-prompt.component';

describe('GroupPropertiesPromptComponent', () => {
	let component: GroupPropertiesPromptComponent;
	let fixture: ComponentFixture<GroupPropertiesPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ReactiveFormsModule],
			providers: [
				MockProvider(GroupsManagementService),
				MockProvider(MatDialogRef),
				MockProvider(MatDialog),
				MockProvider(ProfileSystemService),
				MockProvider(Router),
				FormBuilder,
				MockProvider(MAT_DIALOG_DATA, { id: '', name: '', kind: {} }),
			],
			declarations: [GroupPropertiesPromptComponent],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupPropertiesPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
