import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { MockProvider } from 'ng-mocks';

import { ExportMessageStepComponent } from './export-message-step.component';

describe('ExportMessageStepComponent', () => {
	let component: ExportMessageStepComponent;
	let fixture: ComponentFixture<ExportMessageStepComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExportMessageStepComponent],
			providers: [MockProvider(FilesManagementService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportMessageStepComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
