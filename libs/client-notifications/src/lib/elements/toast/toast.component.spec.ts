import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

import { ToastComponent } from './toast.component';
import { MaterialModule } from '@rumble-pwa/design-system';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MockProvider } from 'ng-mocks';

describe('ToastComponent', () => {
	let component: ToastComponent;
	let fixture: ComponentFixture<ToastComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ToastComponent],
			providers: [
				MockProvider(MAT_SNACK_BAR_DATA, {}),
				MockProvider(MatSnackBarRef, {}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [MaterialModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ToastComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
