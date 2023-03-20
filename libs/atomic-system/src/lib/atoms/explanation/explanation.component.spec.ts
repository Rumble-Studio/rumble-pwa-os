import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';

import { ExplanationComponent } from './explanation.component';

describe('ExplanationComponent', () => {
	let component: ExplanationComponent;
	let fixture: ComponentFixture<ExplanationComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ExplanationComponent],
			imports: [BrowserAnimationsModule, MatTooltipModule],
			providers: [MockProvider(MATERIAL_SANITY_CHECKS, false)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ExplanationComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
