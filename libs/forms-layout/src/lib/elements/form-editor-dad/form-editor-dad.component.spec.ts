import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import {
	FormsManagementService,
	FormsSystemModule,
	RecordingSessionsManagementService,
	StepsManagementService,
} from '@rumble-pwa/forms-system';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { StorageService } from '@rumble-pwa/storage';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';
import { FormEditorDadComponent } from './form-editor-dad.component';

describe('FormEditorDadComponent', () => {
	let component: FormEditorDadComponent;
	let fixture: ComponentFixture<FormEditorDadComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FormEditorDadComponent],
			providers: [
				MockProvider(ActivatedRoute),
				MockProvider(AmplitudeService),
				MockProvider(MatDialog),
				MockProvider(NotificationsService),
				MockProvider(ProfileSystemService),
				MockProvider(StepsManagementService),
				MockProvider(FormsManagementService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule, FormsSystemModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormEditorDadComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
