import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { TtsService } from '@rumble-pwa/record-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';

import { TtsPromptComponent } from './tts-prompt.component';

describe('TtsPromptComponent', () => {
	let component: TtsPromptComponent;
	let fixture: ComponentFixture<TtsPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FormsModule],
			declarations: [TtsPromptComponent],
			providers: [
				MockProvider(MAT_DIALOG_DATA),
				MockProvider(NotificationsService),
				MockProvider(TtsService),
				MockProvider(NotificationsService),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
				}),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TtsPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
