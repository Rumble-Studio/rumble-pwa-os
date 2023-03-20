import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TodoGenericComponent } from '../todo-generic/todo-generic.component';

@UntilDestroy()
@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'todo',
	templateUrl: './todo.component.html',
	styleUrls: ['./todo.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		//
		MatTooltipModule,
		CommonModule,
	],
})
export class TodoComponent extends TodoGenericComponent {
	openDialog() {
		const coord = this.el.nativeElement.getBoundingClientRect();
		this._openDialog(coord.left + 10, coord.top + 10).subscribe();
	}
}
