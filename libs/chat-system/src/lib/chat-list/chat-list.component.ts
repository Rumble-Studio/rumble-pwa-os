import { Component, OnInit } from '@angular/core';
import { ChatService } from '../chat.service';

@Component({
	selector: 'rumble-pwa-chat-list',
	templateUrl: './chat-list.component.html',
	styleUrls: ['./chat-list.component.scss'],
})
export class ChatListComponent implements OnInit {
	constructor(private chatService: ChatService) {}

	ngOnInit(): void {
		this.chatService.getAllMessages();
	}
}
