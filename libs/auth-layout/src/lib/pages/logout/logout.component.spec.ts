import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { MockProvider } from 'ng-mocks';
import { LogoutComponent } from './logout.component';

describe('LogoutComponent', () => {
	let component: LogoutComponent;
	let fixture: ComponentFixture<LogoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [LogoutComponent],
			providers: [MockProvider(AuthService)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(LogoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
