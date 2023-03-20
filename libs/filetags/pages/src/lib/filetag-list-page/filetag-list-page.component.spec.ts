import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiletagListPageComponent } from './filetag-list-page.component';

describe('FiletagListPageComponent', () => {
	let component: FiletagListPageComponent;
	let fixture: ComponentFixture<FiletagListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FiletagListPageComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FiletagListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
