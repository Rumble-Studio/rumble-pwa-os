import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Todo } from '../todo.model';
import { TodoService } from '../todo.service';

@Component({
	selector: 'rumble-pwa-todo-dialog',
	templateUrl: './todo-dialog.component.html',
	styleUrls: ['./todo-dialog.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, CommonModule],
})
export class TodoDialogComponent {
	confirmTerm: string;

	todo: Todo;
	constructor(
		private dialogRef: MatDialogRef<TodoDialogComponent, string | undefined>,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			todo: Todo;
			confirmTerm?: string;
		},
		protected sanitizer: DomSanitizer,
		private _todoService: TodoService
	) {
		this.todo = data.todo;
		this.confirmTerm = data.confirmTerm ?? 'Got it!';
		dialogRef.disableClose = true;
		dialogRef.backdropClick().subscribe(() => {
			this.dialogRef.close();
		});
	}

	dismissTodo() {
		this._todoService.dismissTodo(this.todo);
		this.dialogRef.close();
	}

	doAction() {
		this._todoService.doTodoAction(this.todo);
		this.dialogRef.close();
	}

	public sanitize(url: string) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
}
