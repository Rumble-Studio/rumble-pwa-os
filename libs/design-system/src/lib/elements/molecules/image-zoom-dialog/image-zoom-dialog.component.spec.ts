import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MockProvider } from 'ng-mocks';
import { MaterialModule } from '../../../material.module';
import { ImageZoomDialogComponent } from './image-zoom-dialog.component';

describe('ImageZoomDialogComponent', () => {
	let component: ImageZoomDialogComponent;
	let fixture: ComponentFixture<ImageZoomDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ImageZoomDialogComponent],
			providers: [
				MockProvider(MatDialogRef),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MAT_DIALOG_DATA, { data: { imgSrc: '', title: '' } }),
			],
			imports: [MaterialModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ImageZoomDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
