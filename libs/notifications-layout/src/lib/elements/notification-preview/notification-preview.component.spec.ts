import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationPreviewComponent } from './notification-preview.component';

describe('NotificationPreviewComponent', () => {
	let component: NotificationPreviewComponent;
	let fixture: ComponentFixture<NotificationPreviewComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [NotificationPreviewComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(NotificationPreviewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
