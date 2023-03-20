import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingSessionShortPreviewComponent } from './recording-session-short-preview.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';
import { StorageService } from '@rumble-pwa/storage';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

describe('RecordingSessionShortPreviewComponent', () => {
	let component: RecordingSessionShortPreviewComponent;
	let fixture: ComponentFixture<RecordingSessionShortPreviewComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [RecordingSessionShortPreviewComponent],
			imports: [HttpClientTestingModule, RouterTestingModule, DesignSystemModule],
			providers: [MockProvider(StorageService), MockProvider(MATERIAL_SANITY_CHECKS, false)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(RecordingSessionShortPreviewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
