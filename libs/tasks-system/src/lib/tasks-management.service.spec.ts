import { CommonModule, APP_BASE_HREF } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';
import { TasksManagementService } from './tasks-management.service';
import { StorageService } from '@rumble-pwa/storage';

describe('TasksManagementService', () => {
	let service: TasksManagementService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				RouterModule.forRoot([]),
				HttpClientModule,
				CommonModule,
				BrowserModule,
				BrowserAnimationsModule,
				DesignSystemModule,
			],
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(APP_BASE_HREF, '/'),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		});
	});

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(TasksManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
