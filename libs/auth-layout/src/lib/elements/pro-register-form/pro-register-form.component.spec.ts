import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { SessionState } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProRegisterFormComponent } from './pro-register-form.component';

describe('ProRegisterFormComponent', () => {
	let component: ProRegisterFormComponent;
	let fixture: ComponentFixture<ProRegisterFormComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ProRegisterFormComponent],
			providers: [
				MockProvider(ActivatedRoute, { queryParamMap: new Observable<ParamMap>() }),
				MockProvider(AuthService, {
					session$$: new BehaviorSubject<SessionState>({ token: '' }),
				}),
			],
			imports: [ReactiveFormsModule, RouterTestingModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ProRegisterFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
