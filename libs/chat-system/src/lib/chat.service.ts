import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from './interface';

@Injectable({
	providedIn: 'root',
})
export class ChatService {
	socket: Socket;

	constructor() {
		this.socket = io('http://127.0.0.1:8000', { path: '/ws/v1/socket.io' });
		console.log({ socket: this.socket });
	}

	joinChannel(channel_id: string, username: string): void {
		this.socket.emit('join_chat', {
			channel_id: channel_id,
			username: username,
		});
	}

	leaveChannel(channel_id: string): void {
		this.socket.emit('leave_room', channel_id);
	}

	closeRoom(channel_id: string): void {
		this.socket.emit('delete_room', channel_id);
	}

	sendMessage(channel_id: string, content: string, sender: string): void | boolean {
		if (!content?.trim()) return false;

		const message: Partial<ChatMessage> = {
			channel_id: channel_id,
			message: content,
			sender: sender,
			timestamp: Date(),
		};

		this.socket.emit('send_message', {
			channel_id: message.channel_id,
			username: message.sender,
			message: message.message,
		});
	}

	getMessagesFromChannel(channel_id: string): Array<ChatMessage> {
		this.socket.emit('messages_by_channel', channel_id);

		const allMessages: Array<ChatMessage> = [];

		this.socket.on('messages_by_channel', (data: Array<ChatMessage>) => {
			data.forEach((msg: ChatMessage) => {
				allMessages.push(msg);
			});
		});

		return allMessages;
	}

	async getAllMessages(): Promise<ChatMessage> {
		this.socket.emit('all_messages');

		let allMessages: any;

		try {
			this.socket.on('all_messages', async (data: Promise<any>) => {
				allMessages = await data;
			});
		} catch (e) {
			console.log(e);
		}
		console.log(allMessages);
		return allMessages;
	}

	restCreateChatroom(title: string) {
		// not implemented yet
		console.warn('Not implemented', { title });
	}
}
