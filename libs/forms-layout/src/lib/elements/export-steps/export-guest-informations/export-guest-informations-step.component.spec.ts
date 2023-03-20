import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { MockProvider } from 'ng-mocks';

import { ExportGuestInformationsStepComponent } from './export-guest-informations-step.component';

describe('ExportGuestInformationsStepComponent', () => {
	let component: ExportGuestInformationsStepComponent;
	let fixture: ComponentFixture<ExportGuestInformationsStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportGuestInformationsStepComponent],
			providers: [MockProvider(FilesManagementService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportGuestInformationsStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
