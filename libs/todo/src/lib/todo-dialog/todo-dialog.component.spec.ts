import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { TodoDialogComponent } from './todo-dialog.component';

describe('TodoDialogComponent', () => {
	let component: TodoDialogComponent;
	let fixture: ComponentFixture<TodoDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TodoDialogComponent],
			providers: [
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(MatDialogRef, {}),
				MockProvider(MAT_DIALOG_DATA, {
					todo: {
						title: 'title',
						subtitle: 'subtitle',
						cancelTerm: 'cancel',
						todoTerm: 'todo',
						kind: 'CONFIRM',
					},
				}),
				MockProvider(MatDialogRef, {
					backdropClick() {
						return new BehaviorSubject<any>({});
					},
				}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TodoDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
