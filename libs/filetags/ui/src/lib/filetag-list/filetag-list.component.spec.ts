import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiletagListComponent } from './filetag-list.component';

describe('FiletagListComponent', () => {
	let component: FiletagListComponent;
	let fixture: ComponentFixture<FiletagListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FiletagListComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FiletagListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
