import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyEmailClaimComponent } from './verify-email-claim.component';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StorageService } from '@rumble-pwa/storage';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

describe('VerifyEmailClaimComponent', () => {
	let component: VerifyEmailClaimComponent;
	let fixture: ComponentFixture<VerifyEmailClaimComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [VerifyEmailClaimComponent],
			providers: [
				MockProvider(ActivatedRoute, {
					queryParamMap: new Observable<ParamMap>(),
				}),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),

				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [DesignSystemModule, HttpClientTestingModule, RouterTestingModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(VerifyEmailClaimComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
