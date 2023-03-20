import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { StorageModule, StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { ProResetPageComponent } from './pro-reset-page.component';

describe('ProResetPageComponent', () => {
	let component: ProResetPageComponent;
	let fixture: ComponentFixture<ProResetPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ProResetPageComponent],
			imports: [DesignSystemModule, StorageModule, HttpClientTestingModule, RouterTestingModule],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(ActivatedRoute, { queryParamMap: new Observable<ParamMap>() }),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ProResetPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
