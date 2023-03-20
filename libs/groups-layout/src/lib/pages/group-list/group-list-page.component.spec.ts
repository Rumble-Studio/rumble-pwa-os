import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';

import { GroupListPageComponent } from './group-list-page.component';

describe('GroupListPageComponent', () => {
	let component: GroupListPageComponent;
	let fixture: ComponentFixture<GroupListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GroupListPageComponent],
			providers: [
				MockProvider(MatDialog),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
