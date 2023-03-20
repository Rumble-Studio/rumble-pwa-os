import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import {
	AnswersManagementService,
	FormsManagementService,
	RecordingSessionsManagementService,
	StepsManagementService,
} from '@rumble-pwa/forms-system';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';

import { FormsAsSourceComponent } from './forms-as-source.component';

describe('FormAsSourceComponent', () => {
	let component: FormsAsSourceComponent;
	let fixture: ComponentFixture<FormsAsSourceComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule],
			declarations: [FormsAsSourceComponent],
			providers: [
				MockProvider(StepsManagementService),
				MockProvider(AnswersManagementService),
				MockProvider(FormsManagementService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(FilesManagementService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormsAsSourceComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
