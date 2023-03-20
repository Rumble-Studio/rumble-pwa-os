import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TodoGenericComponent } from '../todo-generic/todo-generic.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'todo-open',
	templateUrl: './todo-open.component.html',
	styleUrls: ['./todo-open.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, CommonModule],
})
export class TodoOpenComponent extends TodoGenericComponent {
	@Input()
	private _confirmTerm?: string | undefined = 'Got it!';
	public get confirmTerm(): string | undefined {
		return this._confirmTerm;
	}
	public set confirmTerm(value: string | undefined) {
		this._confirmTerm = value;
	}
}
