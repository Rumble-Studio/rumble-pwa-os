import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { User } from '@rumble-pwa/mega-store';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { TeamInvitationClaimComponent } from './team-invitation-claim.component';

describe('TeamInvitationClaimComponent', () => {
	let component: TeamInvitationClaimComponent;
	let fixture: ComponentFixture<TeamInvitationClaimComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterTestingModule],
			declarations: [TeamInvitationClaimComponent],
			providers: [
				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
				MockProvider(RestService),
				MockProvider(ProfileSystemService, {
					profile$$: new BehaviorSubject<User | undefined>({
						id: 'test',
						email: 'test@test.com',
						fullName: 'TEST',
						isTest: true,
						isActive: false,
						newsletterSubscribed: true,
					}),
				}),
				MockProvider(NotificationsService),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TeamInvitationClaimComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
