import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { TodoOpenComponent } from './todo-open.component';

describe('TodoOpenComponent', () => {
	let component: TodoOpenComponent;
	let fixture: ComponentFixture<TodoOpenComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TodoOpenComponent],
			imports: [RouterTestingModule],
			providers: [MockProvider(MATERIAL_SANITY_CHECKS, false), MockProvider(MatDialog)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TodoOpenComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
