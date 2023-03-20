import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandsManagementService } from '@rumble-pwa/brands-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { MockProvider } from 'ng-mocks';

import { ExportWelcomeStepComponent } from './export-welcome-step.component';

describe('ExportWelcomeStepComponent', () => {
	let component: ExportWelcomeStepComponent;
	let fixture: ComponentFixture<ExportWelcomeStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportWelcomeStepComponent],
			providers: [MockProvider(FilesManagementService), MockProvider(BrandsManagementService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportWelcomeStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
