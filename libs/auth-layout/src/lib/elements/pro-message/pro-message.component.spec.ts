import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { ProMessageComponent } from './pro-message.component';
import { LayoutService } from '@rumble-pwa/utils';

describe('ProMessageComponent', () => {
	let component: ProMessageComponent;
	let fixture: ComponentFixture<ProMessageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ProMessageComponent],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(LayoutService, {
					layoutSize$$: new BehaviorSubject<number>(0),
				}),
			],
			imports: [MaterialModule, BrowserAnimationsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ProMessageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
