import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat/chat.component';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatContainerComponent } from './chat-container/chat-container.component';

@NgModule({
	imports: [CommonModule, FormsModule],
	declarations: [ChatComponent, ChatListComponent, ChatContainerComponent],
	exports: [ChatContainerComponent],
	providers: [ChatService],
})
export class ChatSystemModule {}
