import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import {
	AnswersManagementService,
	FormsManagementService,
	RecordingSessionsManagementService,
	StepsManagementService,
} from '@rumble-pwa/forms-system';
import { GlobalPlayerService } from '@rumble-pwa/global-player';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { StorageService } from '@rumble-pwa/storage';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { RecordingSessionListComponent } from './recording-session-list.component';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

describe('RecordingSessionListComponent', () => {
	let component: RecordingSessionListComponent;
	let fixture: ComponentFixture<RecordingSessionListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [RecordingSessionListComponent],
			providers: [
				MockProvider(RecordingSessionsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(AnswersManagementService),
				MockProvider(StepsManagementService),
				MockProvider(FilesManagementService),
				MockProvider(FormsManagementService),
				MockProvider(GlobalPlayerService),
				MockProvider(MatDialog),
				MockProvider(MixesManagementService),
				MockProvider(Router),
				MockProvider(NotificationsService),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [DesignSystemModule],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(RecordingSessionListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
