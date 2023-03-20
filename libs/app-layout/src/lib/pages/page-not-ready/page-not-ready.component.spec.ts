import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageNotReadyComponent } from './page-not-ready.component';

describe('PageNotReadyComponent', () => {
	let component: PageNotReadyComponent;
	let fixture: ComponentFixture<PageNotReadyComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PageNotReadyComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(PageNotReadyComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
