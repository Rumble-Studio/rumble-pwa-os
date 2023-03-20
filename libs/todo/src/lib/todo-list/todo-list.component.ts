import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { tap } from 'rxjs/operators';
import { TodoListItemComponent } from '../todo-list-item/todo-list-item.component';
import { Todo } from '../todo.model';
import { TodoService } from '../todo.service';

@UntilDestroy()
@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'todo-list',
	templateUrl: './todo-list.component.html',
	styleUrls: ['./todo-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, CommonModule, TodoListItemComponent],
})
export class TodoListComponent {
	@Input() title = 'Todo list';
	@Input() description = 'Quick list of items you could do to get you started.';

	private _todos: Todo[] = [];
	public get todos() {
		return this._todos;
	}
	@Input()
	public set todos(newTodos) {
		this._todos = newTodos;
		this._updateHiddenState();
	}

	constructor(private _elementRef: ElementRef, private _todoService: TodoService) {
		this._todoService.todoStatesInProfile$
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this._updateHiddenState();
				})
			)
			.subscribe();
	}

	private _updateHiddenState() {
		const display =
			this.todos.length > 0 &&
			this.todos.some((todo) => {
				const todoDone = this._todoService.isTodoDone(todo);
				return !todoDone;
			});
		this._elementRef.nativeElement.style.display = display ? '' : 'none';
	}
}
