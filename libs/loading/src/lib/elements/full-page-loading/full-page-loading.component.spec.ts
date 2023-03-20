import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullPageLoadingComponent } from './full-page-loading.component';

describe('FullPageLoadingComponent', () => {
	let component: FullPageLoadingComponent;
	let fixture: ComponentFixture<FullPageLoadingComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [FullPageLoadingComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FullPageLoadingComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
