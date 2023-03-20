import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { GroupViewerComponent } from './group-viewer.component';

describe('GroupViewerComponent', () => {
	let component: GroupViewerComponent;
	let fixture: ComponentFixture<GroupViewerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GroupViewerComponent],
			providers: [MockProvider(ActivatedRoute, { params: new Observable<Params>() })],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupViewerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
