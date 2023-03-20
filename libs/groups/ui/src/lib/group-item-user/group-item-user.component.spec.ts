import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { MockProvider } from 'ng-mocks';

import { GroupItemUserComponent } from './group-item-user.component';

describe('GroupItemUserComponent', () => {
	let component: GroupItemUserComponent;
	let fixture: ComponentFixture<GroupItemUserComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MatTooltipModule],
			providers: [MockProvider(UsersManagementService), MockProvider(MATERIAL_SANITY_CHECKS, false)],
			declarations: [GroupItemUserComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupItemUserComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
