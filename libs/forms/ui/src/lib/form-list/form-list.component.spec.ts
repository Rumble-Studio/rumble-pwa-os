import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService, StepsManagementService } from '@rumble-pwa/forms-system';
import { Form } from '@rumble-pwa/mega-store';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { FormListComponent } from './form-list.component';

describe('FormListComponent', () => {
	let component: FormListComponent;
	let fixture: ComponentFixture<FormListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FormListComponent],
			providers: [
				MockProvider(FormsManagementService, {
					forms$$: new BehaviorSubject<Form[]>([]),
				}),
				MockProvider(MatDialog),
				MockProvider(StepsManagementService),
				MockProvider(NotificationsService),
				MockProvider(PlaylistsManagementService),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
