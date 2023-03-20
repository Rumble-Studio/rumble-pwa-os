import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageItemPageComponent } from './page-item-page.component';

describe('PageItemPageComponent', () => {
	let component: PageItemPageComponent;
	let fixture: ComponentFixture<PageItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PageItemPageComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(PageItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
