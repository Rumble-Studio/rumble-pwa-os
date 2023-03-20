import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesListPageComponent } from './notes-list-page.component';

describe('NotesListPageComponent', () => {
	let component: NotesListPageComponent;
	let fixture: ComponentFixture<NotesListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [NotesListPageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(NotesListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
