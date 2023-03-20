import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RsBrowserComponent } from './rs-browser.component';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { MockModule, MockProvider } from 'ng-mocks';
import { NotificationsService } from '@rumble-pwa/client-notifications';

describe('RsBrowserComponent', () => {
	let component: RsBrowserComponent;
	let fixture: ComponentFixture<RsBrowserComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [RsBrowserComponent],
			imports: [MockModule(DesignSystemModule)],
			providers: [MockProvider(NotificationsService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(RsBrowserComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
