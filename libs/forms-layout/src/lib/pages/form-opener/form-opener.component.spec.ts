import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, ParamMap, Params, RouterModule } from '@angular/router';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FormsManagementService, StepsManagementService } from '@rumble-pwa/forms-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { FormOpenerComponent } from './form-opener.component';

describe('FormOpenerComponent', () => {
	let component: FormOpenerComponent;
	let fixture: ComponentFixture<FormOpenerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterModule],
			declarations: [FormOpenerComponent],
			providers: [
				MockProvider(NotificationsService),
				MockProvider(FormsManagementService),
				MockProvider(StepsManagementService),
				MockProvider(MatDialog),
				MockProvider(ProfileSystemService),
				MockProvider(ActivatedRoute, {
					params: new Observable<Params>(),
					queryParamMap: new Observable<ParamMap>(),
				}),
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
		fixture = TestBed.createComponent(FormOpenerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
