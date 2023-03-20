import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { MockProvider } from 'ng-mocks';

import { ExportNumberStepComponent } from './export-number-step.component';

describe('ExportNumberStepComponent', () => {
	let component: ExportNumberStepComponent;
	let fixture: ComponentFixture<ExportNumberStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportNumberStepComponent],
			providers: [MockProvider(NotificationsService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportNumberStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
