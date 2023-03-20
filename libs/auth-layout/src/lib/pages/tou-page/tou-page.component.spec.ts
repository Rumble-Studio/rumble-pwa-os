import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';

import { TouPageComponent } from './tou-page.component';

describe('TouPageComponent', () => {
	let component: TouPageComponent;
	let fixture: ComponentFixture<TouPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TouPageComponent],
			imports: [RouterTestingModule],
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TouPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
