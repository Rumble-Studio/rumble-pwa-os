import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';
import { GuestsLayoutComponent } from './guests-layout.component';

describe('GuestsLayoutComponent', () => {
	let component: GuestsLayoutComponent;
	let fixture: ComponentFixture<GuestsLayoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GuestsLayoutComponent],
			providers: [MockProvider(UsersManagementService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GuestsLayoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
