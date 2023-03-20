import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesignSystemModule } from '@rumble-pwa/design-system';

import { NotificationItemComponent } from './notification-item.component';
import { MockModule } from 'ng-mocks';

describe('NotificationItemComponent', () => {
	let component: NotificationItemComponent;
	let fixture: ComponentFixture<NotificationItemComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [NotificationItemComponent],
			imports: [MockModule(DesignSystemModule)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(NotificationItemComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
