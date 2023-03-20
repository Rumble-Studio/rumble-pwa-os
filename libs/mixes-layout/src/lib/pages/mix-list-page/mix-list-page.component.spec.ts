import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from '@rumble-pwa/design-system';
import { Mix } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { LayoutService } from '@rumble-pwa/utils';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { MixListPageComponent } from './mix-list-page.component';

@Component({
	selector: 'rumble-pwa-mix-list',
	template: '<div></div>',
})
export class FakeMixListComponent {}

describe('MixListPageComponent', () => {
	let component: MixListPageComponent;
	let fixture: ComponentFixture<MixListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MixListPageComponent, FakeMixListComponent],
			providers: [
				MockProvider(LayoutService, {
					layoutSize$$: new BehaviorSubject<number>(0),
				}),

				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MixesManagementService, {
					mixes$$: new BehaviorSubject<Mix[]>([]),
				}),
			],
			imports: [MatDialogModule, MaterialModule, RouterTestingModule],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(MixListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
