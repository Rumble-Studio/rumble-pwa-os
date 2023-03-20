import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectPromptComponent } from './object-prompt.component';

describe('ObjectPromptComponent', () => {
	let component: ObjectPromptComponent;
	let fixture: ComponentFixture<ObjectPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ObjectPromptComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(ObjectPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
