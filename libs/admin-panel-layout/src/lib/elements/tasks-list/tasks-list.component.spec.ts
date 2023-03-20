import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminPanelSystemService } from '@rumble-pwa/admin-panel-system';
import { MaterialModule } from '@rumble-pwa/design-system';
import { TasksManagementService } from '@rumble-pwa/tasks-system';
import { Task } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { TasksListComponent } from './tasks-list.component';

describe('TasksListComponent', () => {
	let component: TasksListComponent;
	let fixture: ComponentFixture<TasksListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MaterialModule, FormsModule, MaterialModule, BrowserAnimationsModule],

			declarations: [TasksListComponent],
			providers: [
				MockProvider(AdminPanelSystemService),
				MockProvider(TasksManagementService, {
					tasks$$: new BehaviorSubject<Task[]>([]),
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TasksListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
