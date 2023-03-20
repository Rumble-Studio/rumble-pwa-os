import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyFailingServiceService } from '../my-failing-service.service';

import { MyParentComponentComponent } from './my-parent-component.component';

// by mocking the service-who-shall-fail we can test the component without the service dependency
jest.mock('../my-failing-service.service');

describe('MyParentComponentComponent', () => {
	let component: MyParentComponentComponent;
	let fixture: ComponentFixture<MyParentComponentComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MyParentComponentComponent],
			providers: [MyFailingServiceService],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(MyParentComponentComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
