import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { RestService } from '@rumble-pwa/requests';
import { User } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { BillingPageComponent } from './billing-page.component';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';

describe('BillingPageComponent', () => {
	let component: BillingPageComponent;
	let fixture: ComponentFixture<BillingPageComponent>;
	const fakeUser = {
		id: '',
		email: '',
		fullName: '',
		isTest: false,
		isActive: false,
		newsletterSubscribed: false,
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterTestingModule, DesignSystemModule],
			declarations: [BillingPageComponent],
			providers: [
				MockProvider(ProfileSystemService, {
					profile$$: new BehaviorSubject<User | undefined>(fakeUser),
				}),
				MockProvider(RestService, {
					get() {
						return new BehaviorSubject<any>({});
					},
				}),
				MockProvider(NotificationsService),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(BillingPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
