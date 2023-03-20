import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MockProvider } from 'ng-mocks';

import { ExportTextStepComponent } from './export-text-step.component';

describe('ExportTextStepComponent', () => {
	let component: ExportTextStepComponent;
	let fixture: ComponentFixture<ExportTextStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportTextStepComponent],
			providers: [MockProvider(NotificationsService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportTextStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
