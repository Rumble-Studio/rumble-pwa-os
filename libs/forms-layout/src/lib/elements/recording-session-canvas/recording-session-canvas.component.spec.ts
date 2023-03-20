import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService, RecordingSessionsManagementService } from '@rumble-pwa/forms-system';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { RecordingSessionCanvasComponent } from './recording-session-canvas.component';

describe('RecordingSessionCanvasComponent', () => {
	let component: RecordingSessionCanvasComponent;
	let fixture: ComponentFixture<RecordingSessionCanvasComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, RouterTestingModule],
			declarations: [RecordingSessionCanvasComponent],
			providers: [
				MockProvider(RecordingSessionsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(FormsManagementService),
				MockProvider(NotificationsService),

				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(RecordingSessionCanvasComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
