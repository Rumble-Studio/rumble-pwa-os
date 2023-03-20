import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { TodoComponent } from './todo.component';

describe('TodoComponent', () => {
	let component: TodoComponent;
	let fixture: ComponentFixture<TodoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TodoComponent],
			imports: [BrowserAnimationsModule, MatTooltipModule, RouterTestingModule],
			providers: [MockProvider(MATERIAL_SANITY_CHECKS, false), MockProvider(MatDialog)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TodoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
