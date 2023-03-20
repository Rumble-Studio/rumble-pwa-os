import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainListPageComponent } from './domain-list-page.component';

describe('DomainListPageComponent', () => {
	let component: DomainListPageComponent;
	let fixture: ComponentFixture<DomainListPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DomainListPageComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(DomainListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
