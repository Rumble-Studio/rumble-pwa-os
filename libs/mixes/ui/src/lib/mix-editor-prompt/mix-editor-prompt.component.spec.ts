import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MaterialModule } from '@rumble-pwa/design-system';
import { FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { MixEditorPromptComponent } from './mix-editor-prompt.component';

describe('MixEditorPromptComponent', () => {
	let component: MixEditorPromptComponent;
	let fixture: ComponentFixture<MixEditorPromptComponent>;

	const jsdomAlert = window.alert;
	const jsdomConfirm = window.confirm;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MixEditorPromptComponent],
			providers: [
				FormBuilder,
				MockProvider(MAT_DIALOG_DATA, {
					Mix: undefined,
					autoPrefill: false,
					goToDashboardAfter: false,
				}),
				MockProvider(MixesManagementService),
				MockProvider(FormsManagementService),
				MockProvider(ProfileSystemService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
					keydownEvents() {
						return new BehaviorSubject<any>({});
					},
				}),
				MockProvider(NotificationsService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [RouterTestingModule, MatDialogModule, MaterialModule, ReactiveFormsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		window.alert = () => {};
		window.confirm = () => {
			return true;
		};
		fixture = TestBed.createComponent(MixEditorPromptComponent);
		component = fixture.componentInstance;
	});

	afterEach(() => {
		window.alert = jsdomAlert;
		window.confirm = jsdomConfirm;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
