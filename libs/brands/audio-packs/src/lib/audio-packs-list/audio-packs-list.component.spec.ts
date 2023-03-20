import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioPacksListComponent } from './audio-packs-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';
import { StorageService } from '@rumble-pwa/storage';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
describe('AudioPacksListComponent', () => {
	let component: AudioPacksListComponent;
	let fixture: ComponentFixture<AudioPacksListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [AudioPacksListComponent],
			imports: [HttpClientTestingModule, RouterTestingModule, DesignSystemModule, BrowserAnimationsModule],
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AudioPacksListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
