import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ChatService } from '../chat.service';
import { ChatMessage } from '../interface';

@Component({
	selector: 'rumble-pwa-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
	pseudo = 'user' + Math.floor(Math.random() * (1000 - 0));
	messageList: Partial<ChatMessage>[] = [];
	channelId = '';
	isReduce = true;

	constructor(private chatService: ChatService) {
		chatService.socket.on('message', (data: ChatMessage) => {
			data.timestamp = Date();
			this.messageList.push(data);
			setTimeout(() => {
				this.scrollToBottom();
			}, 100);
		});
	}

	reduceChatWindow() {
		const chatBox = document.querySelector<HTMLElement>('.chat');
		const chatWidget = document.querySelector<HTMLElement>('.chatWidget');
		const channelForm = document.querySelector<HTMLElement>('.channelForm');

		if (chatBox && chatWidget && channelForm) {
			if (this.isReduce) {
				chatBox.style.height = '300px';
				chatWidget.style.opacity = '1';
				if (!this.channelId) {
					channelForm.style.visibility = 'visible';
				}
			} else {
				chatBox.style.height = '0px';
				chatWidget.style.opacity = '0';
				channelForm.style.visibility = 'hidden';
			}
		}

		this.isReduce = !this.isReduce;
	}

	joinChat(form: NgForm): void {
		this.channelId = form.value.channel;

		this.messageList = this.chatService.getMessagesFromChannel(this.channelId);

		this.chatService.joinChannel(this.channelId, this.pseudo);

		const channelForm = document.querySelector<HTMLElement>('.channelForm');
		if (channelForm) channelForm.style.visibility = 'hidden';

		form.reset();

		setTimeout(() => {
			this.scrollToBottom();
		}, 100);
	}

	leaveChat(): void {
		this.chatService.leaveChannel(this.channelId);
		this.channelId = '';

		const channelForm = document.querySelector<HTMLElement>('.channelForm');
		if (channelForm) channelForm.style.visibility = 'visible';

		this.messageList = [];
	}

	sendMessage(form: NgForm): void {
		this.chatService.sendMessage(this.channelId, form.value.message, this.pseudo);

		const message: Partial<ChatMessage> = {
			channel_id: this.channelId,
			message: form.value.message,
			sender: this.pseudo,
			timestamp: Date(),
		};

		form.reset();
		this.messageList.push(message);
		setTimeout(() => {
			this.scrollToBottom();
		}, 100);
	}

	scrollToBottom() {
		const scroll = document.querySelector('.chatFeed');
		if (scroll) scroll.scrollTop = scroll.scrollHeight;
	}
}
