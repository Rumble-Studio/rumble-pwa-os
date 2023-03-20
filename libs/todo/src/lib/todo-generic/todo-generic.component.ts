import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { filter, tap } from 'rxjs/operators';
import { TodoDialogComponent } from '../todo-dialog/todo-dialog.component';
import { Todo } from '../todo.model';
import { TodoService } from '../todo.service';

@UntilDestroy()
@Component({
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [CommonModule],
})
export class TodoGenericComponent {
	private _todo?: Todo | undefined;
	public get todo(): Todo | undefined {
		return this._todo;
	}
	@Input()
	public set todo(value: Todo | undefined) {
		if (value) {
			if (!value.id.startsWith('todo:')) {
				throw new Error('Todo id must start with "todo:"');
			}
			this._todoService.registerTodo(value);
		}
		this._todo = value;
		this.checkAndUpdate();
	}

	done = false;
	canBeDone = true;
	animate = true;
	available = true;

	profile: User | null = null;

	display = true;

	constructor(
		private cdr: ChangeDetectorRef,
		protected matDialog: MatDialog,
		protected _todoService: TodoService,
		protected el: ElementRef<HTMLElement>,
		protected sanitizer: DomSanitizer,
		private _router: Router,
		private _usersRepository: UsersRepository
	) {
		// subscribe to new routes
		this._router.events
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this.checkAndUpdate();
				})
			)
			.subscribe();

		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				filter((profile) => profile != this.profile),
				tap((profile) => {
					this.profile = profile;
					this.checkAndUpdate();
				})
			)
			.subscribe();

		this._todoService.triggerTodo$
			.pipe(
				untilDestroyed(this),
				tap((todoId) => {
					if (todoId === this.todo?.id) {
						this.doAction();
						this._check();
					}
				})
			)
			.subscribe();
	}

	checkAndUpdate() {
		this.checkIfDone();
		this.checkIfAvailable();
		this.checkIfCanBeDone();
		this.updateHiddenState();
		this._check();
	}

	checkIfDone() {
		if (!this.todo) return;
		this.done = this._todoService.isTodoDone(this.todo);
		this.animate = !this.done;
	}

	checkIfAvailable() {
		if (!this.todo) return;
		this.available = this._todoService.shouldWeDisplayTodo(this.todo);
	}
	checkIfCanBeDone() {
		if (!this.todo) return;
		this.canBeDone = this._todoService.isTodoActionDone(this.todo);
	}

	updateHiddenState() {
		if (!this.todo) return;
		this.display = (this.available && !this.done) || this.todo.alwaysShow === true;
		this.el.nativeElement.style.display = this.display ? '' : 'none';
	}

	dismissTodo() {
		if (this.todo) this._todoService.dismissTodo(this.todo);
	}

	doAction() {
		if (this.todo) this._todoService.doTodoAction(this.todo);
	}

	toggleAnimation(animate?: boolean) {
		if (this.done) return;
		this.animate = animate ?? !this.animate;
	}

	protected _openDialog(left: number, top: number) {
		return this.matDialog
			.open<
				TodoDialogComponent,
				{
					todo: Todo | undefined;
				},
				string | undefined
			>(TodoDialogComponent, {
				width: '90%',
				maxWidth: '500px',
				data: { todo: this.todo },
				backdropClass: 'todoDialogBackDrop',
				panelClass: 'todoDialogPanel',
				// hasBackdrop: false,
				// position: {
				//   top: top + 'px',
				//   left: left + 'px',
				// },
				closeOnNavigation: true,
			})
			.afterClosed();
	}

	public sanitize(url: string) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	private _check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
