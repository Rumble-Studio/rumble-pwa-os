import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TodoGenericComponent } from '../todo-generic/todo-generic.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'todo-list-item',
	templateUrl: './todo-list-item.component.html',
	styleUrls: ['./todo-list-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, CommonModule, MatIconModule],
})
export class TodoListItemComponent extends TodoGenericComponent {}
