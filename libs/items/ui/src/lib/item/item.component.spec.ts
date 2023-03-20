import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { MockProvider } from 'ng-mocks';

import { ItemComponent } from './item.component';

describe('ItemComponent', () => {
	let component: ItemComponent;
	let fixture: ComponentFixture<ItemComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [
				MockProvider(NotificationsService),
				MockProvider(ItemsManagementService),
				MockProvider(MatDialog),
				MockProvider(FilesManagementService),
			],
			declarations: [ItemComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ItemComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
