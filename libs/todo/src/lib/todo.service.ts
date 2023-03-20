import { Injectable } from '@angular/core';
import { applyTransaction } from '@datorama/akita';
import { BrokerService, BROKE_OPTIONS } from '@rumble-pwa/broker-system';
import { User, UserData } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { sortBy } from 'lodash';
import { Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { Todo } from './todo.model';

@Injectable({
	providedIn: 'root',
})
export class TodoService {
	// set of todos
	todos: Set<Todo> = new Set();
	profile: User | null = null;
	triggerTodo$ = new Subject<Todo['id']>();

	todoStatesInProfile$ = new Subject<{ [todoId: string]: string }>();

	triggerTodo(todo: Todo) {
		this.triggerTodo$.next(todo.id);
	}

	constructor(private _usersRepository: UsersRepository, private brokerService: BrokerService) {
		// get a profile copy
		this._usersRepository.connectedUser$$
			.pipe(
				filter((profile) => profile != this.profile),
				tap((profile) => {
					this.profile = profile;
					const todoStates = this._listAllInProfileTodoStates();
					this.todoStatesInProfile$.next(todoStates);
				})
			)
			.subscribe();

		this.brokerService.broker$.subscribe((brokeMessage) => {
			if (brokeMessage === BROKE_OPTIONS.resetHelpers) {
				this.undoAllRegisteredTodos();
			} else if (brokeMessage === BROKE_OPTIONS.launchGuidedTour) {
				const todos = Array.from(this.todos.values()).filter((todo) => !this.isTodoDone(todo));
				if (todos.length > 0) {
					const sortedTodos: Todo[] = sortBy(todos, 'priority');
					const todo = sortedTodos[0];
					if (todo) {
						this.triggerTodo(todo);
					}
				}
			}
		});
	}

	registerTodo(todo: Todo) {
		// this.todos.push(todo);
		this.todos.add(todo);
	}

	undoAllRegisteredTodos() {
		// loop over todos
		applyTransaction;
		{
			for (const todo of this.todos) {
				this._addDataToProfile({ [todo.id]: 'undone' });
			}
		}
	}

	private _listAllInProfileTodoStates(): { [todoId: string]: string } {
		const todos: { [todoId: string]: string } = {};
		if (!this.profile) return todos;
		const defaultUserData: UserData = {};
		const userData: UserData = this.profile.data ? JSON.parse(this.profile.data) : defaultUserData;
		Object.keys(userData).forEach((userDataKey) => {
			if (userDataKey.startsWith('todo:')) {
				todos[userDataKey] = userData[userDataKey] as string;
			}
		});
		return todos;
	}

	isTodoDone(todo: Todo) {
		if (!this.profile) return false;
		const userData: UserData = this.profile.data ? JSON.parse(this.profile.data) : {};
		if (userData[todo.id] === 'done') {
			return true;
		}
		if (userData[todo.id] === 'waiting') {
			if (this.isTodoActionDone(todo)) {
				this._addDataToProfile({ [todo.id]: 'done' });
				return true;
			}
		}
		return false;
	}

	shouldWeDisplayTodo(todo: Todo) {
		let displayConditions = true;
		if (todo.displayConditions) {
			displayConditions = todo.displayConditions.every((condition) => {
				if (condition.startsWith('todo:')) {
					const userData: UserData = this.profile?.data ? JSON.parse(this.profile.data) : {};
					if (userData[condition] === 'done') {
						return true;
					}
					return false;
				} else {
					throw Error('Display conditions can only refer to existing todo for now.');
				}
			});
		}

		if (todo.toDisplay) return displayConditions && todo.toDisplay(todo);
		return displayConditions;
	}

	/**
	 *
	 * @param todo
	 * @returns boolean of the todo situation: is it done ?
	 */
	isTodoActionDone(todo: Todo) {
		// if we have a "isDone" function we eval it
		if (todo.isDone) return todo.isDone(todo);
		return true;
	}

	// evalCondition(condition: string) {
	// 	if (condition.startsWith('todo:')) {
	// 		const userData: UserData = this.profile?.data ? JSON.parse(this.profile.data) : {};
	// 		if (userData[condition] === 'done') {
	// 			return true;
	// 		}
	// 	} else if (condition === 'has-one-interview') {
	// 		return this.formsQuery.forms$$.value.filter((form) => form.ownerId === this.profile?.id).length > 0;
	// 	} else if (condition === 'has-one-branding-kit') {
	// 		// return this._brandsRepository.brands$$.value.filter((brand) => brand.ownerId === this.profile?.id).length > 0;
	// 	} else {
	// 		throw new Error(`Unknown condition ${condition}`);
	// 	}
	// 	return false;
	// }

	doTodoAction(todo: Todo) {
		if (!this.profile || !todo) {
			return;
		}

		if (todo.doAction) todo.doAction(todo);
		// if (action === 'create-branding-kit') {
		// 	this.brokerService.broke('create-branding-kit');
		// } else if (action === 'create-interview') {
		// 	this.brokerService.broke('create-interview');
		// }
		if (this.isTodoActionDone(todo)) {
			this._addDataToProfile({ [todo.id]: 'done' });
		} else {
			this._addDataToProfile({ [todo.id]: 'waiting' });
		}
	}

	dismissTodo(todo: Todo) {
		if (!this.profile || !todo) {
			return;
		}

		if (this.isTodoActionDone(todo)) {
			this._addDataToProfile({ [todo.id]: 'done' });
		} else {
			this._addDataToProfile({ [todo.id]: 'waiting' });
		}
	}

	private _addDataToProfile(dataToAdd: Partial<UserData>) {
		this._usersRepository.addDataToConnectedUser(dataToAdd);
	}
}
