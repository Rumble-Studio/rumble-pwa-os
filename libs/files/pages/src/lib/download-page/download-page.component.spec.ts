import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';
import { DownloadPageComponent } from './download-page.component';

describe('DownloadPageComponent', () => {
	let component: DownloadPageComponent;
	let fixture: ComponentFixture<DownloadPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DownloadPageComponent],
			providers: [
				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			imports: [RouterTestingModule],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(DownloadPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
