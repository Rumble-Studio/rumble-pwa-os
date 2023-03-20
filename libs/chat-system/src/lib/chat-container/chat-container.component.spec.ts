import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatContainerComponent } from './chat-container.component';

describe('ChatContainerComponent', () => {
	let component: ChatContainerComponent;
	let fixture: ComponentFixture<ChatContainerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ChatContainerComponent],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ChatContainerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
