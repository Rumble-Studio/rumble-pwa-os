import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { StorageModule, StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DashComponent } from './dash.component';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DashComponent', () => {
	let component: DashComponent;
	let fixture: ComponentFixture<DashComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule, StorageModule, RouterTestingModule, HttpClientTestingModule],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MatDialog),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			declarations: [DashComponent],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(DashComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
