import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteItemPageComponent } from './note-item-page.component';

describe('NoteItemPageComponent', () => {
	let component: NoteItemPageComponent;
	let fixture: ComponentFixture<NoteItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [NoteItemPageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(NoteItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
