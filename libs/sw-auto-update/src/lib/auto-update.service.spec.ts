import { TestBed } from '@angular/core/testing';
// import { SwUpdate } from '@angular/service-worker';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ClientNotificationsModule } from '@rumble-pwa/client-notifications';
import { AutoUpdateService } from './auto-update.service';
import { MockProvider } from 'ng-mocks';
// import { SwAutoUpdateModule } from './sw-auto-update.module';
describe('AutoUpdateService', () => {
	let service: AutoUpdateService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MockProvider(AutoUpdateService)],
		});
		service = TestBed.inject(AutoUpdateService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
		// expect(service).toBeFalsy();
	});
});
