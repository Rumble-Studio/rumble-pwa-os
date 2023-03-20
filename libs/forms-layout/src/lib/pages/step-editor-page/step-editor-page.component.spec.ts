import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepEditorPageComponent } from './step-editor-page.component';
import { MockProvider } from 'ng-mocks';
import { ActivatedRoute, Params } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { LocalforageStorageService, StorageService } from '@rumble-pwa/storage';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { Observable } from 'rxjs';

describe('StepEditorPageComponent', () => {
	let component: StepEditorPageComponent;
	let fixture: ComponentFixture<StepEditorPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [StepEditorPageComponent],
			providers: [
				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
				MockProvider(StorageService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [HttpClientTestingModule, RouterTestingModule, DesignSystemModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(StepEditorPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
