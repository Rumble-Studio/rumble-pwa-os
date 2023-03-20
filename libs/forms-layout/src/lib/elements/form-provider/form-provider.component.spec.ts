import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { RecorderService } from '@rumble-pwa/record-system';
import { StorageService } from '@rumble-pwa/storage';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { FormProviderComponent } from './form-provider.component';

describe('FormProviderComponent', () => {
	let component: FormProviderComponent;
	let fixture: ComponentFixture<FormProviderComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ReactiveFormsModule],
			declarations: [FormProviderComponent],
			providers: [
				MockProvider(NotificationsService),
				MockProvider(FilesManagementService),
				MockProvider(FormsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(PlaylistsManagementService),
				MockProvider(RecorderService, { recording$: new Observable<boolean>() }),
				MockProvider(FormBuilder, {}),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FormProviderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
