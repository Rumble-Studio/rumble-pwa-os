import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { TracksManagementService } from '@rumble-pwa/player-system';
import { RecorderService } from '@rumble-pwa/record-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { RecordActionsComponent } from './record-actions.component';

describe('RecordActionsComponent', () => {
	let component: RecordActionsComponent;
	let fixture: ComponentFixture<RecordActionsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule],
			declarations: [RecordActionsComponent],
			providers: [
				MockProvider(RecorderService, {
					selectedDevice$: new Observable<MediaDeviceInfo>(),
					recording$: new Observable<boolean>(),
					paused$: new Observable<boolean>(),
					microphoneAccessible$$: new BehaviorSubject<boolean>(false),
				}),
				MockProvider(NotificationsService),
				MockProvider(FilesManagementService),
				MockProvider(TracksManagementService),
				MockProvider(FilesManagementService),
				MockProvider(FilesManagementService),
				MockProvider(FilesManagementService),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(RecordActionsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
