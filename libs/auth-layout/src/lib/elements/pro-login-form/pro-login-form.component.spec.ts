import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { LoadingService } from '@rumble-pwa/loading';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProLoginFormComponent } from './pro-login-form.component';
import { SessionState } from '@rumble-pwa/mega-store';

describe('ProLoginFormComponent', () => {
	let component: ProLoginFormComponent;
	let fixture: ComponentFixture<ProLoginFormComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ProLoginFormComponent],
			providers: [
				MockProvider(LoadingService),
				MockProvider(AuthService, {
					session$$: new BehaviorSubject<SessionState>({ token: '' }),
				}),
				MockProvider(ChangeDetectorRef),
				MockProvider(ActivatedRoute, { queryParamMap: new Observable<ParamMap>() }),
			],
			imports: [RouterTestingModule, ReactiveFormsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ProLoginFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
