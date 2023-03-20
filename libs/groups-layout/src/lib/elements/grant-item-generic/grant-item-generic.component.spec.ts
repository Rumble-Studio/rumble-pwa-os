import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { GrantsManagementService } from '@rumble-pwa/groups-system';

import { MockProvider } from 'ng-mocks';
import { GrantItemGenericComponent } from './grant-item-generic.component';

describe('GrantItemGenericComponent', () => {
	let component: GrantItemGenericComponent;
	let fixture: ComponentFixture<GrantItemGenericComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [MockProvider(GrantsManagementService), MockProvider(FormsManagementService)],
			declarations: [GrantItemGenericComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GrantItemGenericComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
