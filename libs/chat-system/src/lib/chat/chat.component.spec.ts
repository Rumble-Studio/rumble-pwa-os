import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatService } from '@rumble-pwa/chat-system';

import { ChatComponent } from './chat.component';
import { FormsModule } from '@angular/forms';
import { MockProvider } from 'ng-mocks';

jest.mock('@rumble-pwa/chat-system');

describe('ChatComponent', () => {
	let component: ChatComponent;
	let fixture: ComponentFixture<ChatComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ChatComponent],
			providers: [MockProvider(ChatService)],
			imports: [FormsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ChatComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
