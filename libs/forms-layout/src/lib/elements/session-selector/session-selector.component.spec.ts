import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { AnswersManagementService } from '@rumble-pwa/forms-system';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';

import { SessionSelectorComponent } from './session-selector.component';

describe('SessionSelectorComponent', () => {
	let component: SessionSelectorComponent;
	let fixture: ComponentFixture<SessionSelectorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [SessionSelectorComponent],
			providers: [
				MockProvider(MAT_DIALOG_DATA, {
					currentSessionId: '',
					formId: '',
					sessionIds: [],
					recordingSessionIds: [],
				}),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
					keydownEvents() {
						return new BehaviorSubject<any>({});
					},
				}),
				MockProvider(NotificationsService),
				MockProvider(AnswersManagementService),
				MockProvider(PlaylistsManagementService),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SessionSelectorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
