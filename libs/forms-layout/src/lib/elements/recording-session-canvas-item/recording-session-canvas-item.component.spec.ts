import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { AnswersManagementService, FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { GlobalPlayerService } from '@rumble-pwa/global-player';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';

import { RecordingSessionCanvasItemComponent } from './recording-session-canvas-item.component';

describe('RecordingSessionCanvasItemComponent', () => {
	let component: RecordingSessionCanvasItemComponent;
	let fixture: ComponentFixture<RecordingSessionCanvasItemComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, DesignSystemModule],
			declarations: [RecordingSessionCanvasItemComponent],
			providers: [
				MockProvider(FilesManagementService),
				MockProvider(AnswersManagementService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(GlobalPlayerService),
				MockProvider(NotificationsService),
				MockProvider(UsersManagementService),
				MockProvider(FormsManagementService),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(RecordingSessionCanvasItemComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
