import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MaterialModule } from '@rumble-pwa/design-system';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockBuilder, MockProvider, MockRender } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { EditUserPromptComponent } from './edit-user-prompt.component';

describe('EditUserPromptComponent', () => {
	let component: EditUserPromptComponent;
	let fixture: ComponentFixture<EditUserPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [EditUserPromptComponent],
			imports: [MaterialModule, MatDialogModule, FormsModule, ReactiveFormsModule, BrowserAnimationsModule],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
				}),
				MockProvider(MAT_DIALOG_DATA, {
					user: {
						id: '1',
						email: 'email',
						fullName: 'fullName',
						isTest: true,
						isSuperuser: true,
						isActive: true,
						newsletterSubscribed: true,
						hasPassword: true,
						invited: true,
						emailValidated: true,
						anonymous: true,
						data: '',
					},
				}),
				MockProvider(UsersManagementService),
				MockProvider(NotificationsService),
			],
		}).compileComponents();
	});
	beforeEach(() => {
		fixture = TestBed.createComponent(EditUserPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
