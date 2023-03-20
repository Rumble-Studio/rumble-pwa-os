import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { MockProvider } from 'ng-mocks';

import { GroupItemGenericComponent } from './group-item-generic.component';

describe('GroupItemGenericComponent', () => {
	let component: GroupItemGenericComponent;
	let fixture: ComponentFixture<GroupItemGenericComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [MockProvider(GroupsManagementService)],
			declarations: [GroupItemGenericComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupItemGenericComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
