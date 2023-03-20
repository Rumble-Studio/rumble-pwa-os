import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';
import { PermanentDialogComponent } from './permanent-dialog.component';

describe('PermanentDialogComponent', () => {
	let component: PermanentDialogComponent;
	let fixture: ComponentFixture<PermanentDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PermanentDialogComponent],
			providers: [
				MockProvider(MAT_DIALOG_DATA, {}),
				MockProvider(MatDialogRef, {}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [MaterialModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PermanentDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
