import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ServiceWorkerModule } from '@angular/service-worker';
// import { SwAutoUpdateModule } from '@rumble-pwa/sw-auto-update';
import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RestService } from '@rumble-pwa/requests';
import { AutoUpdateService } from '@rumble-pwa/sw-auto-update';

const AutoUpdateServiceStub: Partial<AutoUpdateService> = {
	subcribeToSWUpdates() {
		//do nothing
	},
};
const RestServiceStub: Partial<RestService> = {
	setApiRoot() {
		//do nothing
	},
};

describe('AppComponent', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AppComponent],
			imports: [
				ServiceWorkerModule.register('ngsw-worker.js', {
					enabled: true,
				}),
				RouterTestingModule,
				HttpClientTestingModule,
			],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				{ provide: RestService, useValue: RestServiceStub },
				{ provide: AutoUpdateService, useValue: AutoUpdateServiceStub },
			],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});
});
