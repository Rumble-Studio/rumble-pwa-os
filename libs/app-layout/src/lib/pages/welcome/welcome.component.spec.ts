import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { MaterialModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';
import { WelcomeComponent } from './welcome.component';

describe('WelcomeComponent', () => {
	let component: WelcomeComponent;
	let fixture: ComponentFixture<WelcomeComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [WelcomeComponent],
			providers: [
				MockProvider(ActivatedRoute, { queryParams: new Observable<Params>() }),
				MockProvider(AuthService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [MaterialModule, RouterTestingModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(WelcomeComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
