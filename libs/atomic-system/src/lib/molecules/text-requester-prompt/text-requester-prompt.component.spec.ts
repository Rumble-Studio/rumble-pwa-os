import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextRequesterPromptComponent } from './text-requester-prompt.component';

describe('TextRequesterPromptComponent', () => {
	let component: TextRequesterPromptComponent;
	let fixture: ComponentFixture<TextRequesterPromptComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TextRequesterPromptComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TextRequesterPromptComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
