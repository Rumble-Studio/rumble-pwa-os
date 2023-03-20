import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@rumble-pwa/auth-system';
import { MockProvider } from 'ng-mocks';
import { ProResetFormComponent } from './pro-reset-form.component';

describe('ProResetFormComponent', () => {
	let component: ProResetFormComponent;
	let fixture: ComponentFixture<ProResetFormComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ProResetFormComponent],
			providers: [MockProvider(AuthService)],
			imports: [ReactiveFormsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ProResetFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
