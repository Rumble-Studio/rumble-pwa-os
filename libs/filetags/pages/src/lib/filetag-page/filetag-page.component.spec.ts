import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiletagPageComponent } from './filetag-page.component';

describe('FiletagPageComponent', () => {
	let component: FiletagPageComponent;
	let fixture: ComponentFixture<FiletagPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FiletagPageComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FiletagPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
