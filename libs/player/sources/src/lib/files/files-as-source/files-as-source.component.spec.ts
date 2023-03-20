import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesAsSourceComponent } from './files-as-source.component';

describe('FileAsSourceComponent', () => {
	let component: FilesAsSourceComponent;
	let fixture: ComponentFixture<FilesAsSourceComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FilesAsSourceComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FilesAsSourceComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
